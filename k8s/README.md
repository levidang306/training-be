# Task Management Backend - Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Task Management Backend application.

## Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured to access your cluster
- NGINX Ingress Controller (optional, for ingress)
- Docker registry access

## Quick Start

### 1. Build and Push Docker Image

```bash
# Build the Docker image
docker build -t task-management-be:latest .

# Tag for your registry (replace with your registry)
docker tag task-management-be:latest your-registry/task-management-be:latest

# Push to registry
docker push your-registry/task-management-be:latest
```

### 2. Update Configuration

Before deploying, update the following files with your specific values:

**k8s/secret.yaml:**

```bash
# Encode your secrets to base64
echo -n "your-jwt-secret" | base64
echo -n "your-db-password" | base64
echo -n "your-smtp-user" | base64
echo -n "your-smtp-password" | base64
```

**k8s/configmap.yaml:**

- Update CORS_ORIGIN with your frontend URL
- Update FRONTEND_URL with your frontend URL
- Update SMTP settings

**k8s/deployment.yaml:**

- Update the image name to match your registry

### 3. Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Or apply in order:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

### 4. Verify Deployment

```bash
# Check namespace
kubectl get namespace task-management

# Check all resources
kubectl get all -n task-management

# Check pods status
kubectl get pods -n task-management

# Check services
kubectl get svc -n task-management

# Check ingress
kubectl get ingress -n task-management
```

### 5. Access the Application

**Via NodePort:**

```bash
# Get the node IP
kubectl get nodes -o wide

# Access via: http://<NODE_IP>:30080
```

**Via Ingress:**

```bash
# Add to your /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
<INGRESS_IP> task-management-api.local

# Access via: http://task-management-api.local
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Ingress     │    │   LoadBalancer  │    │    NodePort     │
│  (External)     │    │   (External)    │    │   (External)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │    ClusterIP Service    │
                    │  task-management-svc    │
                    └─────────────┬───────────┘
                                  │
                    ┌─────────────┴───────────┐
                    │       Deployment        │
                    │   task-management-app   │
                    │     (3 replicas)        │
                    └─────────────┬───────────┘
                                  │
                    ┌─────────────┴───────────┐
                    │      PostgreSQL         │
                    │     (StatefulSet)       │
                    │   Persistent Storage    │
                    └─────────────────────────┘
```

## Components

### Core Application

- **Deployment**: Main application with 3 replicas
- **Service**: ClusterIP and NodePort services
- **ConfigMap**: Environment variables
- **Secret**: Sensitive data (passwords, JWT secrets)
- **HPA**: Auto-scaling based on CPU/memory usage

### Database

- **StatefulSet**: PostgreSQL with persistent storage
- **Service**: Database service for internal communication
- **PVC**: Persistent storage for database data

### Networking

- **Ingress**: External access with NGINX
- **Services**: Internal and external connectivity

### Auto-scaling

- **HPA**: Horizontal Pod Autoscaler
  - Min replicas: 2
  - Max replicas: 10
  - Target CPU: 70%
  - Target Memory: 80%

## Environment Variables

| Variable    | Description             | Source    |
| ----------- | ----------------------- | --------- |
| NODE_ENV    | Application environment | ConfigMap |
| PORT        | Application port        | ConfigMap |
| DB_HOST     | Database host           | ConfigMap |
| DB_PASSWORD | Database password       | Secret    |
| JWT_SECRET  | JWT signing secret      | Secret    |
| SMTP_USER   | Email username          | Secret    |
| SMTP_PASS   | Email password          | Secret    |

## Monitoring & Health Checks

The deployment includes:

- **Liveness Probe**: Checks if app is running
- **Readiness Probe**: Checks if app is ready to serve traffic
- **Health Check Endpoint**: `/health-check`

## Scaling

**Manual Scaling:**

```bash
kubectl scale deployment task-management-app --replicas=5 -n task-management
```

**Auto Scaling:**
HPA automatically scales based on CPU and memory usage.

## Troubleshooting

**Check Pod Logs:**

```bash
kubectl logs -f deployment/task-management-app -n task-management
```

**Check Database:**

```bash
kubectl exec -it postgres-0 -n task-management -- psql -U postgres -d task_management
```

**Port Forward for Testing:**

```bash
kubectl port-forward svc/task-management-service 8080:80 -n task-management
```

**Check Events:**

```bash
kubectl get events -n task-management --sort-by='.lastTimestamp'
```

## Security Best Practices

1. **Non-root User**: Application runs as non-root user
2. **Resource Limits**: CPU and memory limits set
3. **Secrets Management**: Sensitive data in Kubernetes secrets
4. **Network Policies**: Consider adding network policies for production
5. **Image Security**: Use specific image tags, not `latest`

## Production Considerations

1. **Image Registry**: Use a private registry
2. **TLS/SSL**: Configure TLS certificates for ingress
3. **Monitoring**: Add monitoring with Prometheus/Grafana
4. **Logging**: Configure centralized logging
5. **Backup**: Set up database backup strategy
6. **Resource Requests**: Fine-tune resource requests/limits
7. **Network Policies**: Implement network segmentation
8. **Pod Security Standards**: Apply security contexts
