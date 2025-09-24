# 🚀 Deployment Guide

This guide covers how to deploy the Task Management Backend using GitHub Actions and Kubernetes.

## 📋 Prerequisites

### Required Secrets in GitHub Repository

Navigate to your repository → Settings → Secrets and variables → Actions, and add these secrets:

#### For Container Registry (GitHub Container Registry)
- `GITHUB_TOKEN` - Automatically provided by GitHub

#### For Kubernetes Deployment
- `KUBE_CONFIG_STAGING` - Base64 encoded kubeconfig for staging cluster
- `KUBE_CONFIG_PRODUCTION` - Base64 encoded kubeconfig for production cluster

#### For Code Coverage (Optional)
- `CODECOV_TOKEN` - Token from codecov.io for coverage reports

### Encoding Kubeconfig for Secrets

```bash
# Encode your kubeconfig file
cat ~/.kube/config | base64 -w 0

# Or for specific config file
cat /path/to/your/kubeconfig | base64 -w 0
```

## 🔄 Workflow Triggers

### 1. PR Tests (`pr-tests.yml`)
**Triggers:**
- Pull request to `main` or `develop` branches
- Push to `main` or `develop` branches

**Actions:**
- ✅ Runs unit tests with coverage
- ✅ Security audit
- ✅ Builds Docker image (no push)
- ✅ Comments on PR with results

### 2. Deployment (`deploy.yml`)
**Triggers:**
- Push to `main` branch (auto-deploy to staging)
- Tags starting with `v*` (deploy to production)
- Manual workflow dispatch

**Actions:**
- ✅ Runs full test suite
- ✅ Builds and pushes Docker image to GHCR
- ✅ Deploys to staging environment
- ✅ Deploys to production (on tags)
- ✅ Creates GitHub release (on tags)

### 3. Code Quality (`code-quality.yml`)
**Triggers:**
- Pull request to `main` or `develop` branches
- Push to `main` or `develop` branches

**Actions:**
- ✅ ESLint and Prettier checks
- ✅ TypeScript type checking
- ✅ Commit message linting
- ✅ Dependency review
- ✅ CodeQL security analysis

## 🌍 Environments

### Staging Environment
- **Namespace:** `task-management-staging`
- **URL:** `https://task-management-staging.example.com`
- **Auto-deployed:** On every push to `main`

### Production Environment
- **Namespace:** `task-management`
- **URL:** `https://task-management-api.example.com`
- **Deployed:** On version tags or manual trigger

## 🏗️ Docker Image

Images are built and pushed to GitHub Container Registry:
- **Registry:** `ghcr.io`
- **Image:** `ghcr.io/levidang306/training-be`
- **Tags:**
  - `latest` - Latest main branch
  - `main` - Main branch builds
  - `v1.2.3` - Version releases
  - `main-abc1234` - SHA-based tags

## 🚀 Deployment Process

### Automatic Deployment (Recommended)

1. **For Staging:**
   ```bash
   git push origin main
   ```

2. **For Production:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### Manual Deployment

1. Go to Actions tab in your GitHub repository
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Choose environment (staging/production)
5. Click "Run workflow"

## 🔧 Local Development Deployment

### Build and Test Locally
```bash
# Install dependencies
pnpm install

# Run tests
pnpm run test:cov

# Build application
pnpm run build

# Build Docker image
docker build -t task-management-be:local .

# Test Docker image locally
docker run -p 8080:8080 --env-file .env task-management-be:local
```

### Deploy to Local Kubernetes
```bash
# Build and load image to local cluster
docker build -t task-management-be:local .

# For Docker Desktop Kubernetes
docker tag task-management-be:local task-management-be:latest

# Update deployment to use local image
kubectl set image deployment/task-management-app task-management=task-management-be:latest -n task-management
```

## 📊 Monitoring Deployment

### Check Deployment Status
```bash
# Check pods
kubectl get pods -n task-management

# Check deployment status
kubectl rollout status deployment/task-management-app -n task-management

# Check logs
kubectl logs -f deployment/task-management-app -n task-management
```

### Health Checks
- **Local:** `http://localhost:8080/health-check`
- **Staging:** `https://task-management-staging.example.com/health-check`
- **Production:** `https://task-management-api.example.com/health-check`

## 🔒 Security Considerations

1. **Secrets Management:**
   - Never commit secrets to repository
   - Use GitHub Secrets for sensitive data
   - Rotate secrets regularly

2. **Image Security:**
   - Images are scanned for vulnerabilities
   - Multi-stage builds reduce attack surface
   - Non-root user in containers

3. **Network Security:**
   - TLS encryption in production
   - Network policies in Kubernetes
   - Rate limiting enabled

## 🐛 Troubleshooting

### Common Issues

1. **Tests Failing:**
   - Check test environment variables
   - Ensure PostgreSQL service is healthy
   - Review test logs in Actions

2. **Docker Build Failing:**
   - Check Dockerfile syntax
   - Verify all files in build context
   - Check build logs for errors

3. **Deployment Failing:**
   - Verify kubeconfig secrets
   - Check Kubernetes cluster connectivity
   - Review deployment logs

4. **Image Pull Errors:**
   - Ensure image was pushed successfully
   - Check image tags and registry
   - Verify image pull policy

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review Kubernetes events: `kubectl get events -n task-management`
3. Check pod logs: `kubectl logs -f <pod-name> -n task-management`
4. Review deployment status: `kubectl describe deployment task-management-app -n task-management`

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)