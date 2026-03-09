import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateEmbeddingsAndPositions } from './compute-embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type KnowledgeCategory = 'Security' | 'Performance' | 'Architecture' | 'Data' | 'DevOps' | 'API';

interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  problem: string;
  solution: string;
  isGated: boolean;
  price?: number;
  isSimulated: boolean;
  upvotes: number;
  downvotes: number;
  position?: { x: number; y: number; z: number };
}

const CATEGORIES: KnowledgeCategory[] = ['Security', 'Performance', 'Architecture', 'Data', 'DevOps', 'API'];

const categoryData: Record<KnowledgeCategory, { components: string[]; issues: string[]; actions: string[]; tools: string[] }> = {
  Security: {
    components: ['authentication layer', 'authorization middleware', 'session manager', 'JWT handler', 'OAuth provider', 'API gateway', 'input validator', 'file upload handler', 'WebSocket connection', 'password reset flow', 'CORS policy', 'CSRF token', 'rate limiter', 'encryption module', 'key rotation system'],
    issues: ['SQL injection', 'XSS vulnerability', 'CSRF attack', 'session hijacking', 'credential stuffing', 'brute force attack', 'path traversal', 'insecure deserialization', 'broken authentication', 'sensitive data exposure', 'broken access control', 'security misconfiguration', 'XML external entity', 'insecure dependencies', 'certificate validation bypass'],
    actions: ['sanitize input', 'validate tokens', 'rotate credentials', 'implement rate limiting', 'add encryption', 'enforce HTTPS', 'audit access logs', 'patch vulnerability', 'harden configuration', 'implement MFA', 'add CSP headers', 'validate certificates', 'isolate secrets', 'scan dependencies'],
    tools: ['DOMPurify', 'bcrypt', 'helmet', 'csurf', 'jsonwebtoken', 'passport', 'oauth2-server', 'rate-limiter-flexible', 'crypto', 'vault', 'letsencrypt', 'snyk', 'owasp-zap', 'sonarqube', 'trivy'],
  },
  Performance: {
    components: ['database query', 'API endpoint', 'frontend bundle', 'image loader', 'cache layer', 'CDN configuration', 'WebSocket stream', 'file processor', 'search index', 'memory allocator', 'event loop', 'connection pool', 'render pipeline', 'data serializer', 'background job'],
    issues: ['N+1 query', 'memory leak', 'unbounded growth', 'blocking I/O', 'excessive re-renders', 'large bundle size', 'slow cold start', 'connection exhaustion', 'cache miss storm', 'CPU throttling', 'garbage collection pause', 'network latency', 'disk I/O bottleneck', 'thread starvation', 'queue backlog'],
    actions: ['optimize query', 'implement caching', 'lazy load assets', 'batch requests', 'compress response', 'pool connections', 'index database', 'profile memory', 'reduce bundle', 'parallelize tasks', 'memoize computation', 'stream data', 'debounce events', 'prefetch resources'],
    tools: ['lighthouse', 'webpack-bundle-analyzer', 'clinic', '0x', 'flamegraph', 'datadog', 'newrelic', 'redis', 'memcached', 'worker-threads', 'bull', 'kafka', 'rabbitmq', 'pg-stat-statements', 'chrome-devtools'],
  },
  Architecture: {
    components: ['service mesh', 'API gateway', 'message broker', 'event bus', 'config server', 'service registry', 'load balancer', 'circuit breaker', 'saga orchestrator', 'domain service', 'repository layer', 'presentation layer', 'infrastructure module', 'cross-cutting concern', 'bounded context'],
    issues: ['circular dependency', 'tight coupling', 'god object', 'anemic domain', 'leaky abstraction', 'distributed monolith', 'chatty interface', 'premature optimization', 'big ball of mud', 'golden hammer', 'boat anchor', 'dead code', 'magic numbers', 'hardcoded values', 'dependency hell'],
    actions: ['extract module', 'apply DI pattern', 'introduce interface', 'refactor layer', 'decouple services', 'implement CQRS', 'apply DDD principles', 'isolate concerns', 'simplify design', 'remove abstraction', 'consolidate logic', 'split monolith', 'standardize contracts'],
    tools: ['inversify', 'awilix', 'nestjs', 'type-graphql', 'prisma', 'typeorm', 'event-storm', 'cqrs-framework', 'hexagonal-arch', 'clean-architecture', 'monorepo', 'nx', 'turborepo', 'lerna', 'rush'],
  },
  Data: {
    components: ['PostgreSQL table', 'MongoDB collection', 'Redis cache', 'Elasticsearch index', 'Kafka topic', 'S3 bucket', 'dynamodb table', 'migration script', 'ETL pipeline', 'data warehouse', 'replication stream', 'shard manager', 'connection pooler', 'query planner', 'transaction log'],
    issues: ['race condition', 'deadlock', 'data corruption', 'replication lag', 'shard imbalance', 'index bloat', 'query timeout', 'constraint violation', 'orphaned record', 'cascading delete', 'migration failure', 'schema drift', 'connection leak', 'transaction deadlock', 'write amplification'],
    actions: ['add index', 'partition table', 'shard data', 'optimize query', 'implement MVCC', 'add constraint', 'batch insert', 'vacuum table', 'analyze stats', 'tune autovacuum', 'add foreign key', 'implement CDC', 'archive old data', 'compress storage'],
    tools: ['pg_dump', 'flyway', 'liquibase', 'prisma-migrate', 'sequelize', 'knex', 'typeorm-migration', 'mongo-migrate', 'redis-migrate', 'aws-dms', 'debezium', 'kafka-connect', 'airflow', 'dbt', 'snowflake'],
  },
  DevOps: {
    components: ['Dockerfile', 'Kubernetes deployment', 'Helm chart', 'CI pipeline', 'CD pipeline', 'Terraform module', 'Ansible playbook', 'monitoring stack', 'logging pipeline', 'alerting rule', 'service mesh', 'ingress controller', 'autoscaler', 'pod disruption budget', 'network policy'],
    issues: ['slow build', 'flaky test', 'deployment failure', 'resource exhaustion', 'configuration drift', 'secret leakage', 'downtime during deploy', 'rollout stuck', 'image bloat', 'health check false positive', 'log overload', 'missing alert', 'IAM misconfiguration', 'network partition', 'certificate expiry'],
    actions: ['optimize build', 'parallelize tests', 'implement canary', 'add resource limits', 'pin dependencies', 'rotate secrets', 'implement blue-green', 'add rollback', 'cache layers', 'tune probes', 'aggregate logs', 'configure alerts', 'audit permissions', 'automate renewal'],
    tools: ['docker', 'kubectl', 'helm', 'terraform', 'ansible', 'jenkins', 'github-actions', 'gitlab-ci', 'argocd', 'flux', 'prometheus', 'grafana', 'loki', 'tempo', 'datadog'],
  },
  API: {
    components: ['REST endpoint', 'GraphQL resolver', 'gRPC service', 'WebSocket handler', 'webhook receiver', 'OAuth flow', 'rate limit policy', 'versioning layer', 'response serializer', 'request validator', 'pagination handler', 'filter parser', 'sort builder', 'error mapper', 'content negotiator'],
    issues: ['breaking change', 'versioning conflict', 'rate limit exceeded', 'timeout overflow', 'pagination inconsistency', 'error format mismatch', 'missing validation', 'CORS rejection', 'content-type error', 'serialization failure', 'backward incompatibility', 'deprecation warning', 'contract violation', 'undocumented field', 'null pointer'],
    actions: ['version endpoint', 'add deprecation header', 'standardize errors', 'implement HATEOAS', 'add OpenAPI spec', 'validate contracts', 'rate limit per tier', 'add retry logic', 'implement idempotency', 'document breaking changes', 'add integration tests', 'stub responses', 'mock services'],
    tools: ['openapi', 'swagger', 'graphql-yoga', 'apollo-server', 'express-graphql', 'fastify', 'hapi', 'restify', 'tsoa', 'typestack', 'zod', 'joi', 'ajv', 'prisma-client', 'orval'],
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMultiple<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateId(index: number): string {
  return `K-${String(index).padStart(3, '0')}`;
}

function generateTitle(category: KnowledgeCategory): string {
  const data = categoryData[category];
  const component = pick(data.components);
  const issue = pick(data.issues);
  
  const templates = [
    `${issue.charAt(0).toUpperCase() + issue.slice(1)} in ${component}`,
    `${component.charAt(0).toUpperCase() + component.slice(1)} causes ${issue}`,
    `Critical ${issue} detected in ${component}`,
    `${component.charAt(0).toUpperCase() + component.slice(1)} suffering from ${issue}`,
    `Unresolved ${issue} impacting ${component}`,
  ];
  
  return pick(templates);
}

function generateProblem(category: KnowledgeCategory, title: string): string {
  const data = categoryData[category];
  const component = pick(data.components);
  const issue = pick(data.issues);
  
  const contextTemplates = [
    `Agent discovered that the ${component} was exhibiting ${issue} behavior, leading to degraded system performance and potential data integrity concerns.`,
    `Investigation revealed ${issue} in the ${component}, causing intermittent failures in production traffic.`,
    `The ${component} showed signs of ${issue} during routine monitoring, triggering automated alerts.`,
    `Users reported issues traced back to ${issue} within the ${component}, affecting approximately 15% of requests.`,
    `Static analysis flagged potential ${issue} in the ${component} codebase, confirmed through targeted testing.`,
    `Load testing exposed ${issue} in the ${component} under high concurrency scenarios.`,
    `Security audit identified ${issue} vulnerability in the ${component} handling user input.`,
    `Performance profiling revealed ${issue} as the root cause of elevated latency in the ${component}.`,
    `Database monitoring detected ${issue} pattern originating from the ${component}.`,
    `Log analysis correlated multiple error signatures to ${issue} in the ${component}.`,
  ];
  
  const stepTemplates = [
    ['- Analyzed logs and identified anomaly in the component\n- Isolated the issue to specific code path\n- Reproduced the issue in staging environment\n- Confirmed root cause through debugging\n- Documented findings for team review'],
    ['- Enabled verbose logging for affected component\n- Captured metrics during peak traffic\n- Compared behavior against baseline\n- Identified deviation in expected flow\n- Traced execution path to failure point'],
    ['- Received user reports of intermittent failures\n- Queried monitoring dashboards for patterns\n- Found correlation with specific request types\n- Extracted failing request samples\n- Replayed requests to confirm reproducibility'],
    ['- Automated alert triggered at 3 AM\n- On-call engineer investigated the alert\n- Found error rate spike in the component\n- Narrowed down to recent deployment\n- Identified faulty commit through bisect'],
    ['- Performance baseline exceeded threshold\n- Initiated root cause analysis\n- Profiled the component under load\n- Found bottleneck in critical path\n- Quantified impact on user experience'],
    ['- Security scanner reported vulnerability\n- Reviewed scanner findings\n- Confirmed exploitability in production\n- Assessed potential impact radius\n- Prioritized remediation timeline'],
    ['- Integration test started failing\n- Examined test output and stack trace\n- Compared passing vs failing states\n- Found regression in dependent module\n- Linked to upstream dependency update'],
    ['- Customer escalated service degradation\n- Pulled APM traces for affected period\n- Identified slow operations in component\n- Found cascading timeout pattern\n- Mapped service dependency graph'],
  ];
  
  return pick(contextTemplates) + '\n\n' + pick(stepTemplates);
}

function generateSolution(category: KnowledgeCategory, title: string): string {
  const data = categoryData[category];
  const actions = pickMultiple(data.actions, 2, 4);
  const tools = pickMultiple(data.tools, 1, 3);
  
  const contextTemplates = [
    `Implemented a multi-phase fix addressing the root cause, with monitoring to prevent regression.`,
    `Applied targeted remediation using ${tools.join(' and ')}, followed by comprehensive testing.`,
    `Deployed incremental fix with rollback plan, validated through canary release strategy.`,
    `Refactored affected component to eliminate the issue, adding safeguards for future prevention.`,
    `Introduced ${actions[0]} pattern combined with ${actions[1] || 'improved error handling'} to resolve the issue.`,
    `Leveraged ${tools[0]} to ${actions[0]}, reducing occurrence probability by 99%.`,
    `Implemented defensive coding practices and ${actions.join(', ')} to address the underlying problem.`,
    `Applied hotfix to production, followed by deeper architectural improvement in subsequent release.`,
  ];
  
  const generateSteps = (): string => {
    const stepCount = Math.floor(Math.random() * 2) + 4; // 4-5 steps
    const steps: string[] = [];
    
    const actionSteps = [
      `- Implement ${actions[0]} in the affected module`,
      `- Add ${tools[0]} for enhanced monitoring`,
      `- Configure ${actions[1] || actions[0]} with appropriate thresholds`,
      `- Deploy fix to staging environment`,
      `- Run integration test suite to validate fix`,
      `- Monitor metrics for 24 hours post-deployment`,
      `- Update documentation with resolution details`,
      `- Add regression test to prevent future occurrences`,
      `- Configure alerting on key indicators`,
      `- Review and merge PR with peer approval`,
      `- Perform load testing to validate performance`,
      `- Schedule follow-up review in one week`,
      `- Notify stakeholders of resolution`,
      `- Clean up temporary debugging code`,
      `- Update runbook with troubleshooting steps`,
    ];
    
    const shuffled = actionSteps.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, stepCount).join('\n');
  };
  
  return pick(contextTemplates) + '\n\n' + generateSteps();
}

function generateEntry(index: number): KnowledgeEntry {
  const category = CATEGORIES[index % CATEGORIES.length];
  const title = generateTitle(category);
  
  const isGated = Math.random() < 0.3; // 30% gated
  const price = isGated ? Number((Math.random() * 5 + 0.1).toFixed(2)) : undefined; // $0.10 to $5.10
  
  const isSimulated = Math.random() < 0.4; // 40% simulated

  const totalVotes = Math.floor(Math.pow(Math.random(), 3) * 500);
  const upvoteRatio = 0.5 + (Math.random() * 0.5); // 50% to 100% upvotes
  const upvotes = Math.floor(totalVotes * upvoteRatio);
  const downvotes = totalVotes - upvotes;

  return {
    id: generateId(index),
    category,
    title,
    problem: generateProblem(category, title),
    solution: generateSolution(category, title),
    isGated,
    price,
    isSimulated,
    upvotes,
    downvotes,
  };
}

function generateAllEntries(count: number): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  for (let i = 1; i <= count; i++) {
    entries.push(generateEntry(i));
  }
  // Shuffle to randomize category distribution in the UI
  return entries.sort(() => Math.random() - 0.5);
}

async function main() {
  const count = 1000;
  const entries = generateAllEntries(count);
  
  // Generate embeddings and compute 3D positions based on semantic similarity
  console.log('Computing embeddings for semantic clustering...');
  const texts = entries.map(e => `${e.title}. ${e.problem.split('\n')[0]}`);
  const embeddingResults = await generateEmbeddingsAndPositions(texts);
  
  // Assign computed positions to entries
  entries.forEach((entry, i) => {
    entry.position = embeddingResults[i].position3D;
  });
  
  const output = `// Auto-generated knowledge data - ${new Date().toISOString()}
// Run: npx ts-node scripts/generate-knowledge.ts to regenerate

export type KnowledgeCategory =
  | "Security"
  | "Performance"
  | "Architecture"
  | "Data"
  | "DevOps"
  | "API";

export interface Knowledge {
  id: string;
  category: KnowledgeCategory;
  title: string;
  problem: string;
  solution: string;
  isGated: boolean;
  price?: number;
  isSimulated: boolean;
  upvotes: number;
  downvotes: number;
  position?: { x: number; y: number; z: number };
}

export const CATEGORY_COLORS: Record<KnowledgeCategory, number[]> = {
  Security:     [220, 20, 60],    // Crimson
  Performance:  [255, 215, 0],    // Gold
  Architecture: [255, 69, 0],     // Orange Red
  Data:         [255, 140, 0],    // Dark Orange
  DevOps:       [255, 99, 71],    // Tomato
  API:          [255, 127, 80],   // Coral
};

export const CATEGORY_LIST: KnowledgeCategory[] = [
  "Architecture",
  "Data",
  "Performance",
  "Security",
  "DevOps",
  "API",
];

export const KNOWLEDGE_DATA: Knowledge[] = ${JSON.stringify(entries, null, 2)};

export function getKnowledgeById(id: string): Knowledge | undefined {
  return KNOWLEDGE_DATA.find((k) => k.id === id);
}

export function getKnowledgeByCategory(category: KnowledgeCategory): Knowledge[] {
  return KNOWLEDGE_DATA.filter((k) => k.category === category);
}
`;

  const outputPath = join(__dirname, '..', 'src', 'data', 'knowledge.ts');
  writeFileSync(outputPath, output);
  console.log(`Generated ${count} entries to ${outputPath}`);
}

main();
