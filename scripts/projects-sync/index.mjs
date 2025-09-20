import { readFile } from 'node:fs/promises';
import { graphql } from '@octokit/graphql';

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const prefix = `--${name}`;
  const index = args.findIndex((arg) => arg === prefix || arg.startsWith(`${prefix}=`));
  if (index === -1) return fallback;

  const [inlinePrefix, inlineValue] = args[index].split('=', 2);
  if (inlineValue !== undefined) {
    return inlineValue === '' ? true : inlineValue;
  }

  const next = args[index + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

const CONFIG_PATH = getArg('config', 'ops/workflows/projects/kanban.v1.json');
const DRY_RUN_FLAG = getArg('dry-run', false);
const DRY_RUN = DRY_RUN_FLAG === true || DRY_RUN_FLAG === 'true';

const token = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('GITHUB_TOKEN is required');
  process.exit(1);
}

const owner = process.env.REPO_OWNER;
if (!owner) {
  console.error('REPO_OWNER is required');
  process.exit(1);
}

let repoEnv = process.env.REPO_NAME || process.env.GITHUB_REPOSITORY;
if (!repoEnv) {
  console.error('REPO_NAME or GITHUB_REPOSITORY is required');
  process.exit(1);
}

const repoParts = repoEnv.split('/');
const repo = repoParts[repoParts.length - 1];

const gh = graphql.defaults({
  headers: {
    authorization: `token ${token}`,
  },
});

function logStep(message) {
  console.log(`::group::${message}`);
}

function endStep() {
  console.log('::endgroup::');
}

async function loadConfig(path) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

const ORG_PROJECTS_QUERY = `
  query ($login: String!, $after: String) {
    organization(login: $login) {
      projectsV2(first: 20, after: $after) {
        nodes {
          id
          title
          number
          closed
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const USER_PROJECTS_QUERY = `
  query ($login: String!, $after: String) {
    user(login: $login) {
      projectsV2(first: 20, after: $after) {
        nodes {
          id
          title
          number
          closed
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

async function paginateProjects(query, key, login) {
  const nodes = [];
  let after = null;
  let sawContainer = false;

  while (true) {
    const data = await gh(query, { login, after });
    const container = data[key];
    if (!container) break;
    sawContainer = true;

    const page = container.projectsV2;
    nodes.push(...(page?.nodes || []));
    if (!page?.pageInfo?.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }

  return sawContainer ? nodes : null;
}

function isMissingOrgError(error, login) {
  if (!error || !error.errors) return false;
  return error.errors.some((entry) => entry.message?.includes(`Could not resolve to an Organization with the login of '${login}'`));
}

async function getProjectsV2(login) {
  try {
    const nodes = await paginateProjects(ORG_PROJECTS_QUERY, 'organization', login);
    if (nodes) return { nodes, scope: 'organization' };
  } catch (error) {
    if (!isMissingOrgError(error, login)) throw error;
  }

  const userNodes = await paginateProjects(USER_PROJECTS_QUERY, 'user', login);
  return { nodes: userNodes || [], scope: 'user' };
}

async function findProjectId(projects, cfg) {
  const targetName = cfg.project?.name;
  if (targetName) {
    const exact = projects.find((project) => project.title === targetName);
    if (exact) return exact.id;
  }

  const openProject = projects.find((project) => project.closed === false);
  return openProject ? openProject.id : undefined;
}

const LIST_ITEMS_QUERY = `
  query ($projectId: ID!, $after: String) {
    node(id: $projectId) {
      ... on ProjectV2 {
        items(first: 50, after: $after) {
          nodes {
            id
            type
            content {
              ... on Issue {
                id
                number
                title
                labels(first: 50) {
                  nodes {
                    name
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
`;

async function listItems(projectId) {
  const items = [];
  let after = null;

  while (true) {
    const result = await gh(LIST_ITEMS_QUERY, { projectId, after });
    const project = result.node;
    if (!project) break;

    const page = project.items;
    items.push(...(page.nodes || []));

    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }

  return items;
}

const SINGLE_SELECT_QUERY = `
  query ($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        fields(first: 100) {
          nodes {
            __typename
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

async function getSingleSelectField(projectId, fieldName) {
  const data = await gh(SINGLE_SELECT_QUERY, { projectId });
  const fields = data.node?.fields?.nodes || [];

  const field = fields.find((entry) => entry?.__typename === 'ProjectV2SingleSelectField' && entry?.name === fieldName);

  if (!field) return undefined;

  const options = field.options || [];
  return {
    id: field.id,
    name: field.name,
    options,
  };
}

const UPDATE_SINGLE_SELECT_MUTATION = `
  mutation ($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(
      input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: { singleSelectOptionId: $optionId }
      }
    ) {
      clientMutationId
    }
  }
`;

async function setSingleSelect(projectId, itemId, fieldId, optionId) {
  if (DRY_RUN) {
    console.log(`[dry-run] set field ${fieldId} on item ${itemId} -> option ${optionId}`);
    return;
  }

  await gh(UPDATE_SINGLE_SELECT_MUTATION, {
    projectId,
    itemId,
    fieldId,
    optionId,
  });
}

function labelSet(labels) {
  return new Set((labels?.nodes || []).map((label) => label.name));
}

async function applyRules(cfg, projectId, items, statusField) {
  if (!statusField) return;
  const options = statusField.options || [];
  const optionMap = new Map(options.map((option) => [option.name, option.id]));

  for (const rule of cfg.rules || []) {
    if (rule.name === 'Subissues leave No Status') {
      const targetOptionId = optionMap.get('To Do');
      if (!targetOptionId) continue;

      for (const item of items) {
        if (!item?.content) continue;
        const labels = labelSet(item.content.labels);
        const isSubissue = labels.has('subissue') || labels.has('type:subissue');
        if (!isSubissue) continue;

        await setSingleSelect(projectId, item.id, statusField.id, targetOptionId);
      }
    }
  }
}

(async function main() {
  logStep('Load config');
  const config = await loadConfig(CONFIG_PATH);
  console.log({ project: config.project, owner, repo });
  endStep();

  logStep('Fetch projects');
  const { nodes: projects, scope } = await getProjectsV2(owner);
  console.log({ scope, projects: projects.map((project) => ({ number: project.number, title: project.title, id: project.id, closed: project.closed })) });
  const projectId = await findProjectId(projects, config);
  if (!projectId) {
    console.error('No project found matching config.project.name.');
    process.exit(1);
  }
  console.log(`Using projectId: ${projectId}`);
  endStep();

  logStep('Fetch items');
  const items = await listItems(projectId);
  console.log(`Items: ${items.length}`);
  endStep();

  logStep('Locate Status field');
  const statusFieldName = config.mappings?.statusField || 'Status';
  const statusField = await getSingleSelectField(projectId, statusFieldName);
  if (!statusField) {
    console.error(`Status field "${statusFieldName}" not found.`);
    process.exit(1);
  }
  console.log(statusField.options?.map((option) => option.name));
  endStep();

  logStep(DRY_RUN ? 'Apply rules (dry-run)' : 'Apply rules');
  await applyRules(config, projectId, items, statusField);
  endStep();

  console.log('Done.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
