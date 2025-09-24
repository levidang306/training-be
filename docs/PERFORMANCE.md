# ⚡ Performance Guide

## 🌟 Overview

This guide covers comprehensive performance optimization strategies for the Task Management Backend, including database optimization, caching strategies, application performance tuning, and monitoring.

## 🗄️ Database Performance

### Query Optimization

#### Index Strategy

```typescript
// User entity with optimized indexes
@Entity('users')
@Index(['email'], { unique: true })
@Index(['isActive', 'createdAt'])
@Index(['role', 'isActive'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  @Index() // Single column index for frequent lookups
  email: string;

  @Column({ type: 'varchar', length: 100 })
  @Index() // Index for search operations
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  @Index() // Index for search operations
  lastName: string;

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  @Index() // Index for role-based queries
  role: Role;

  @Column({ type: 'boolean', default: true })
  @Index() // Index for filtering active users
  isActive: boolean;

  @CreateDateColumn()
  @Index() // Index for date-based queries
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Project entity with composite indexes
@Entity('projects')
@Index(['userId', 'isActive']) // Composite index for user's active projects
@Index(['isPublic', 'createdAt']) // For public project listings
@Index(['name'], { fulltext: true }) // Full-text search on MySQL
export class Project extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### Optimized Query Patterns

```typescript
export class ProjectRepository {
  constructor(private dataSource: DataSource) {}

  // Efficient pagination with cursor-based approach
  async findProjectsPaginated(userId: string, cursor?: string, limit: number = 20) {
    const queryBuilder = this.dataSource
      .getRepository(Project)
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .where('project.userId = :userId', { userId })
      .andWhere('project.isActive = :isActive', { isActive: true })
      .orderBy('project.createdAt', 'DESC')
      .limit(limit + 1); // Get one extra to check if there are more

    if (cursor) {
      queryBuilder.andWhere('project.createdAt < :cursor', { cursor });
    }

    const projects = await queryBuilder.getMany();
    const hasMore = projects.length > limit;

    if (hasMore) {
      projects.pop(); // Remove the extra record
    }

    return {
      projects,
      hasMore,
      nextCursor: hasMore ? projects[projects.length - 1].createdAt : null,
    };
  }

  // Efficient search with full-text indexing
  async searchProjects(query: string, limit: number = 10) {
    return await this.dataSource
      .getRepository(Project)
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .where('project.isActive = :isActive', { isActive: true })
      .andWhere('project.isPublic = :isPublic', { isPublic: true })
      .andWhere(
        new Brackets((qb) => {
          qb.where('MATCH(project.name) AGAINST(:query IN NATURAL LANGUAGE MODE)', { query })
            .orWhere('project.name ILIKE :likeQuery', { likeQuery: `%${query}%` })
            .orWhere('project.description ILIKE :likeQuery', { likeQuery: `%${query}%` });
        })
      )
      .orderBy('project.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  // Bulk operations for better performance
  async createMultipleProjects(projectsData: Partial<Project>[]) {
    return await this.dataSource.getRepository(Project).createQueryBuilder().insert().values(projectsData).execute();
  }

  // Efficient aggregation queries
  async getUserProjectStats(userId: string) {
    const result = await this.dataSource
      .getRepository(Project)
      .createQueryBuilder('project')
      .select([
        'COUNT(CASE WHEN project.isActive = true THEN 1 END) as activeProjects',
        'COUNT(CASE WHEN project.isPublic = true THEN 1 END) as publicProjects',
        'COUNT(*) as totalProjects',
      ])
      .where('project.userId = :userId', { userId })
      .getRawOne();

    return {
      activeProjects: parseInt(result.activeProjects),
      publicProjects: parseInt(result.publicProjects),
      totalProjects: parseInt(result.totalProjects),
    };
  }
}
```

### Connection Pooling

```typescript
// Optimized TypeORM configuration
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // Connection pooling configuration
  extra: {
    // Maximum number of connections in the pool
    max: 20,

    // Minimum number of connections in the pool
    min: 2,

    // Maximum time in milliseconds that a connection can remain idle
    idleTimeoutMillis: 30000,

    // Maximum time in milliseconds to wait for a connection
    connectionTimeoutMillis: 2000,

    // Enable keep-alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,

    // SSL configuration for production
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  },

  // Logging configuration (disable in production)
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],

  // Cache configuration
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      // Cache TTL in milliseconds
      duration: 30000, // 30 seconds
    },
  },

  entities: [User, Project, Board, Card, Comment],
  migrations: ['src/common/migrations/*.ts'],
  synchronize: false, // Never use in production
  migrationsRun: true,
});
```

## 🚀 Caching Strategies

### Redis Caching Implementation

```typescript
import Redis from 'ioredis';
import { promisify } from 'util';

export class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour in seconds

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,

      // Connection pool settings
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  // Generic cache methods
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  async mget(keys: string[]): Promise<(any | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      logger.error('Cache mget error:', { keys, error });
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Array<[string, any]>, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      keyValuePairs.forEach(([key, value]) => {
        pipeline.setex(key, ttl, JSON.stringify(value));
      });

      await pipeline.exec();
    } catch (error) {
      logger.error('Cache mset error:', { keyValuePairs, error });
    }
  }

  // Pattern-based deletion
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', { pattern, error });
    }
  }

  // Cache with fallback to database
  async getOrSet<T>(key: string, fallback: () => Promise<T>, ttl: number = this.defaultTTL): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fallback();
    await this.set(key, value, ttl);
    return value;
  }
}

// Cache middleware for express routes
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `api:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function (body: any) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, body, ttl);
        }

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};
```

### Application-Level Caching

```typescript
// Service layer with caching
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private cacheService: CacheService
  ) {}

  async getProject(id: string, userId: string): Promise<Project | null> {
    const cacheKey = `project:${id}:${userId}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const project = await this.projectRepository.findById(id);

        // Check permissions
        if (!project || !this.hasReadAccess(project, userId)) {
          return null;
        }

        return project;
      },
      600 // 10 minutes
    );
  }

  async getUserProjects(userId: string, page: number = 1): Promise<any> {
    const cacheKey = `user_projects:${userId}:${page}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.projectRepository.findByUserId(userId, page);
      },
      300 // 5 minutes
    );
  }

  async updateProject(id: string, updateData: Partial<Project>): Promise<Project> {
    const project = await this.projectRepository.update(id, updateData);

    // Invalidate related caches
    await this.invalidateProjectCaches(id, project.userId);

    return project;
  }

  private async invalidateProjectCaches(projectId: string, userId: string): Promise<void> {
    const patterns = [
      `project:${projectId}:*`,
      `user_projects:${userId}:*`,
      `project_stats:${userId}`,
      `public_projects:*`,
    ];

    await Promise.all(patterns.map((pattern) => this.cacheService.delPattern(pattern)));
  }
}

// Query result caching with TypeORM
export class CachedProjectRepository extends ProjectRepository {
  constructor(
    dataSource: DataSource,
    private cacheService: CacheService
  ) {
    super(dataSource);
  }

  async findById(id: string): Promise<Project | null> {
    const cacheKey = `project_entity:${id}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await super.findById(id);
      },
      1800 // 30 minutes
    );
  }

  async findPublicProjects(limit: number = 20): Promise<Project[]> {
    const cacheKey = `public_projects:${limit}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.dataSource.getRepository(Project).find({
          where: { isPublic: true, isActive: true },
          relations: ['user'],
          order: { createdAt: 'DESC' },
          take: limit,
        });
      },
      900 // 15 minutes
    );
  }
}
```

## 🔄 API Response Optimization

### Response Compression

```typescript
import compression from 'compression';

// Compression middleware configuration
export const compressionMiddleware = compression({
  // Only compress responses larger than 1kb
  threshold: 1024,

  // Compression level (1-9, 6 is default)
  level: 6,

  // Custom filter function
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter
    return compression.filter(req, res);
  },

  // Memory level (1-9, 8 is default)
  memLevel: 8,

  // Compression strategy
  strategy: compression.constants.Z_DEFAULT_STRATEGY,
});
```

### Response Pagination

```typescript
// Efficient pagination utility
export class PaginationUtil {
  static async paginate<T>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  // Cursor-based pagination for better performance on large datasets
  static async paginateWithCursor<T>(
    queryBuilder: SelectQueryBuilder<T>,
    cursor?: string,
    limit: number = 20,
    orderBy: string = 'createdAt'
  ): Promise<{
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    if (cursor) {
      queryBuilder.andWhere(`entity.${orderBy} < :cursor`, { cursor });
    }

    const items = await queryBuilder
      .orderBy(`entity.${orderBy}`, 'DESC')
      .limit(limit + 1)
      .getMany();

    const hasMore = items.length > limit;
    if (hasMore) {
      items.pop();
    }

    const nextCursor = hasMore && items.length > 0 ? (items[items.length - 1] as any)[orderBy] : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}

// Pagination middleware
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  req.pagination = { page, limit };
  next();
};
```

### Response Serialization

```typescript
// Efficient response serialization
export class ResponseSerializer {
  // Remove sensitive fields from user object
  static serializeUser(user: User): Partial<User> {
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  // Serialize project with related data
  static serializeProject(project: Project, includeUser: boolean = true): any {
    const serialized: any = {
      id: project.id,
      name: project.name,
      description: project.description,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    if (includeUser && project.user) {
      serialized.user = this.serializeUser(project.user);
    }

    return serialized;
  }

  // Batch serialization for arrays
  static serializeProjects(projects: Project[], includeUser: boolean = true): any[] {
    return projects.map((project) => this.serializeProject(project, includeUser));
  }

  // Dynamic field selection
  static selectFields<T>(obj: T, fields: (keyof T)[]): Partial<T> {
    const result: Partial<T> = {};

    fields.forEach((field) => {
      if (field in obj) {
        result[field] = obj[field];
      }
    });

    return result;
  }
}

// Field selection middleware
export const fieldSelectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const fields = req.query.fields as string;

  if (fields) {
    req.selectedFields = fields.split(',').map((field) => field.trim());
  }

  next();
};
```

## 📊 Application Performance Monitoring

### Performance Metrics Collection

```typescript
import { performance } from 'perf_hooks';
import client from 'prom-client';

// Prometheus metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();

  // Track active connections
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (performance.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record metrics
    httpRequestDuration.labels(method, route, statusCode).observe(duration);

    httpRequestTotal.labels(method, route, statusCode).inc();

    activeConnections.dec();

    // Log slow requests
    if (duration > 1) {
      logger.warn('Slow request detected', {
        method,
        route,
        duration,
        statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
  });

  next();
};

// Database query monitoring
export class PerformanceQueryRunner extends QueryRunner {
  async query(query: string, parameters?: any[]): Promise<any> {
    const startTime = performance.now();
    const queryType = query.trim().split(' ')[0].toLowerCase();

    try {
      const result = await super.query(query, parameters);

      const duration = (performance.now() - startTime) / 1000;

      // Extract table name from query (simplified)
      const tableMatch =
        query.match(/FROM\s+([^\s]+)/i) ||
        query.match(/UPDATE\s+([^\s]+)/i) ||
        query.match(/INSERT\s+INTO\s+([^\s]+)/i);
      const table = tableMatch ? tableMatch[1] : 'unknown';

      databaseQueryDuration.labels(queryType, table).observe(duration);

      // Log slow queries
      if (duration > 0.1) {
        logger.warn('Slow query detected', {
          query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
          duration,
          parameters,
        });
      }

      return result;
    } catch (error) {
      logger.error('Database query error', {
        query,
        parameters,
        error: error.message,
      });
      throw error;
    }
  }
}
```

### Memory Management

```typescript
// Memory monitoring
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryUsageGauge: client.Gauge;
  private gcDurationHistogram: client.Histogram;

  constructor() {
    this.memoryUsageGauge = new client.Gauge({
      name: 'nodejs_memory_usage_bytes',
      help: 'Node.js memory usage in bytes',
      labelNames: ['type'],
    });

    this.gcDurationHistogram = new client.Histogram({
      name: 'nodejs_gc_duration_seconds',
      help: 'Time spent in garbage collection',
      labelNames: ['gc_type'],
    });

    this.startMonitoring();
  }

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  private startMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();

      this.memoryUsageGauge.labels('rss').set(memUsage.rss);
      this.memoryUsageGauge.labels('heapTotal').set(memUsage.heapTotal);
      this.memoryUsageGauge.labels('heapUsed').set(memUsage.heapUsed);
      this.memoryUsageGauge.labels('external').set(memUsage.external);

      // Log memory warnings
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;

      if (heapUsedMB > 500) {
        // 500MB warning threshold
        logger.warn('High memory usage detected', {
          heapUsed: `${heapUsedMB.toFixed(2)}MB`,
          heapTotal: `${heapTotalMB.toFixed(2)}MB`,
          usage: `${((heapUsedMB / heapTotalMB) * 100).toFixed(2)}%`,
        });
      }
    }, 30000);

    // Monitor garbage collection
    if (process.env.NODE_ENV === 'production') {
      const PerformanceObserver = require('perf_hooks').PerformanceObserver;

      const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'gc') {
            this.gcDurationHistogram.labels(entry.detail?.kind?.toString() || 'unknown').observe(entry.duration / 1000);
          }
        });
      });

      obs.observe({ entryTypes: ['gc'] });
    }
  }

  // Force garbage collection (use carefully)
  forceGC(): void {
    if (global.gc) {
      global.gc();
      logger.info('Forced garbage collection');
    } else {
      logger.warn('Garbage collection not available. Start Node.js with --expose-gc flag');
    }
  }
}
```

## 🚀 Load Testing & Benchmarking

### Artillery Load Testing Configuration

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:8080'
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 5
      name: 'Warm-up'

    # Ramp-up phase
    - duration: 120
      arrivalRate: 5
      rampTo: 25
      name: 'Ramp-up'

    # Sustained load phase
    - duration: 300
      arrivalRate: 25
      name: 'Sustained load'

    # Spike test
    - duration: 60
      arrivalRate: 100
      name: 'Spike test'

    # Cool-down phase
    - duration: 60
      arrivalRate: 25
      rampTo: 5
      name: 'Cool-down'

  processor: './artillery-processor.js'

  # Performance thresholds
  ensure:
    thresholds:
      - http.response_time.p95: 1000 # 95th percentile < 1s
      - http.response_time.p99: 2000 # 99th percentile < 2s
      - http.request_rate: 20 # At least 20 req/sec
      - http.response_time.median: 500 # Median < 500ms

  # Global variables
  variables:
    testUserEmail: 'loadtest@example.com'
    testUserPassword: 'testPassword123'

scenarios:
  - name: 'Authentication flow'
    weight: 30
    flow:
      - post:
          url: '/auth/login'
          json:
            email: '{{ testUserEmail }}'
            password: '{{ testUserPassword }}'
          capture:
            - json: '$.responseObject.accessToken'
              as: 'accessToken'

      - get:
          url: '/user/profile'
          headers:
            Authorization: 'Bearer {{ accessToken }}'

      - get:
          url: '/projects'
          headers:
            Authorization: 'Bearer {{ accessToken }}'

  - name: 'Project operations'
    weight: 40
    flow:
      - function: 'loginUser'

      - post:
          url: '/projects'
          headers:
            Authorization: 'Bearer {{ accessToken }}'
          json:
            name: 'Load Test Project {{ $randomString() }}'
            description: 'Project created during load testing'
            isPublic: false
          capture:
            - json: '$.responseObject.id'
              as: 'projectId'

      - get:
          url: '/projects/{{ projectId }}'
          headers:
            Authorization: 'Bearer {{ accessToken }}'

      - put:
          url: '/projects/{{ projectId }}'
          headers:
            Authorization: 'Bearer {{ accessToken }}'
          json:
            name: 'Updated Load Test Project'
            description: 'Updated during load testing'

  - name: 'Public content browsing'
    weight: 30
    flow:
      - get:
          url: '/projects/public'

      - get:
          url: '/health'
```

### Artillery Processor Functions

```javascript
// artillery-processor.js
module.exports = {
  loginUser: loginUser,
  beforeRequest: beforeRequest,
  afterResponse: afterResponse,
};

const users = [
  { email: 'user1@example.com', password: 'password123' },
  { email: 'user2@example.com', password: 'password123' },
  { email: 'user3@example.com', password: 'password123' },
];

function loginUser(requestParams, context, ee, next) {
  // Select random user
  const user = users[Math.floor(Math.random() * users.length)];

  const request = {
    url: '/auth/login',
    method: 'POST',
    json: {
      email: user.email,
      password: user.password,
    },
  };

  ee.emit('request');

  // Make login request
  require('http').request(request, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.responseObject && result.responseObject.accessToken) {
          context.vars.accessToken = result.responseObject.accessToken;
        }
      } catch (error) {
        console.error('Login failed:', error);
      }

      return next();
    });
  });
}

function beforeRequest(requestParams, context, ee, next) {
  // Add timestamp to track request duration
  context.vars._requestStart = Date.now();
  return next();
}

function afterResponse(requestParams, response, context, ee, next) {
  // Calculate and log response time
  const duration = Date.now() - context.vars._requestStart;

  if (duration > 2000) {
    console.log(`Slow request detected: ${requestParams.url} took ${duration}ms`);
  }

  return next();
}
```

### Performance Testing Scripts

```bash
#!/bin/bash
# performance-test.sh

echo "🚀 Starting Performance Testing Suite"

# Build and start the application
echo "Building application..."
npm run build

echo "Starting application in test mode..."
NODE_ENV=test PORT=8080 npm start &
APP_PID=$!

# Wait for application to start
sleep 10

# Run load tests
echo "Running load tests..."

# Basic load test
echo "📊 Running basic load test..."
artillery run artillery-config.yml --output basic-load-test.json

# Generate HTML report
artillery report basic-load-test.json --output basic-load-test-report.html

# API endpoint specific tests
echo "📊 Running API endpoint tests..."
artillery run test-configs/api-endpoints.yml --output api-test.json

# Database load test
echo "📊 Running database load test..."
artillery run test-configs/database-load.yml --output db-test.json

# Memory leak test (long running)
echo "📊 Running memory leak test..."
artillery run test-configs/memory-leak.yml --output memory-test.json

# Stop the application
kill $APP_PID

echo "✅ Performance testing completed"
echo "📈 Reports generated:"
echo "  - basic-load-test-report.html"
echo "  - API test results: api-test.json"
echo "  - Database test results: db-test.json"
echo "  - Memory test results: memory-test.json"
```

## 📈 Performance Optimization Checklist

### Database Optimization

- [ ] Proper indexing strategy implemented
- [ ] Query performance analyzed and optimized
- [ ] Connection pooling configured
- [ ] Database caching enabled
- [ ] Query result pagination implemented
- [ ] N+1 query problems identified and resolved
- [ ] Database monitoring and alerting set up

### Caching Strategy

- [ ] Redis caching implemented for frequently accessed data
- [ ] Cache invalidation strategy defined
- [ ] Cache hit/miss ratios monitored
- [ ] HTTP response caching implemented
- [ ] CDN integration for static assets
- [ ] Browser caching headers configured

### Application Performance

- [ ] Response compression enabled
- [ ] Efficient serialization implemented
- [ ] Memory leaks identified and fixed
- [ ] Garbage collection optimized
- [ ] Event loop monitoring implemented
- [ ] Async/await patterns used correctly
- [ ] Error handling doesn't impact performance

### API Optimization

- [ ] Response pagination implemented
- [ ] Field selection/filtering available
- [ ] Bulk operations available where needed
- [ ] Rate limiting configured appropriately
- [ ] Response times measured and optimized
- [ ] API documentation includes performance guidelines

### Infrastructure

- [ ] Load balancing configured
- [ ] Auto-scaling policies defined
- [ ] Container resource limits set
- [ ] Health checks implemented
- [ ] Monitoring and alerting configured
- [ ] Performance baselines established

### Monitoring & Alerting

- [ ] Application metrics collected (Prometheus)
- [ ] Database performance monitored
- [ ] Memory usage tracked
- [ ] Response time alerts configured
- [ ] Error rate monitoring enabled
- [ ] Performance dashboards created

## 📚 Performance Resources

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Express.js Performance Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Redis Performance Optimization](https://redis.io/docs/management/optimization/)
- [Artillery Load Testing](https://artillery.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/introduction/overview/)
- [TypeORM Performance](https://typeorm.io/performance-tips)
