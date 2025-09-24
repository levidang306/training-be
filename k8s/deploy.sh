#!/bin/bash

# Task Management Backend - Kubernetes Deployment Script
# This script deploys the Task Management application to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="task-management"
APP_NAME="task-management-app"
IMAGE_NAME="task-management-be"
IMAGE_TAG="latest"

echo -e "${GREEN}🚀 Starting Task Management Backend Deployment${NC}"

# Function to check if kubectl is installed
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed. Please install kubectl first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ kubectl is available${NC}"
}

# Function to check if cluster is accessible
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Kubernetes cluster is accessible${NC}"
}

# Function to create namespace if it doesn't exist
create_namespace() {
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        echo -e "${YELLOW}⚠️  Namespace $NAMESPACE already exists${NC}"
    else
        kubectl apply -f k8s/namespace.yaml
        echo -e "${GREEN}✅ Namespace $NAMESPACE created${NC}"
    fi
}

# Function to apply secrets
apply_secrets() {
    echo -e "${YELLOW}📝 Applying secrets...${NC}"
    kubectl apply -f k8s/secret.yaml
    echo -e "${GREEN}✅ Secrets applied${NC}"
}

# Function to apply configmap
apply_configmap() {
    echo -e "${YELLOW}📝 Applying configmap...${NC}"
    kubectl apply -f k8s/configmap.yaml
    echo -e "${GREEN}✅ ConfigMap applied${NC}"
}

# Function to deploy PostgreSQL
deploy_postgres() {
    echo -e "${YELLOW}🐘 Deploying PostgreSQL...${NC}"
    kubectl apply -f k8s/postgres.yaml
    
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
}

# Function to deploy application
deploy_app() {
    echo -e "${YELLOW}🚀 Deploying application...${NC}"
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    
    echo -e "${YELLOW}⏳ Waiting for application to be ready...${NC}"
    kubectl wait --for=condition=available deployment/$APP_NAME -n $NAMESPACE --timeout=300s
    echo -e "${GREEN}✅ Application is ready${NC}"
}

# Function to apply ingress
apply_ingress() {
    echo -e "${YELLOW}🌐 Applying ingress...${NC}"
    kubectl apply -f k8s/ingress.yaml
    echo -e "${GREEN}✅ Ingress applied${NC}"
}

# Function to apply HPA
apply_hpa() {
    echo -e "${YELLOW}📈 Applying HPA...${NC}"
    kubectl apply -f k8s/hpa.yaml
    echo -e "${GREEN}✅ HPA applied${NC}"
}

# Function to show deployment status
show_status() {
    echo -e "${GREEN}📊 Deployment Status:${NC}"
    echo
    kubectl get all -n $NAMESPACE
    echo
    echo -e "${GREEN}🔍 Pod Details:${NC}"
    kubectl get pods -n $NAMESPACE -o wide
    echo
    echo -e "${GREEN}🌐 Services:${NC}"
    kubectl get svc -n $NAMESPACE
    echo
    echo -e "${GREEN}🚪 Ingress:${NC}"
    kubectl get ingress -n $NAMESPACE
}

# Function to show access information
show_access_info() {
    echo
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo
    echo -e "${YELLOW}📋 Access Information:${NC}"
    
    # NodePort access
    NODE_PORT=$(kubectl get svc task-management-nodeport -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')
    echo -e "${GREEN}NodePort Access:${NC}"
    echo "  http://<NODE_IP>:$NODE_PORT"
    echo
    
    # Ingress access
    echo -e "${GREEN}Ingress Access:${NC}"
    echo "  Add to /etc/hosts: <INGRESS_IP> task-management-api.local"
    echo "  Then access: http://task-management-api.local"
    echo
    
    # Port forward access
    echo -e "${GREEN}Local Port Forward:${NC}"
    echo "  kubectl port-forward svc/task-management-service 8080:80 -n $NAMESPACE"
    echo "  Then access: http://localhost:8080"
    echo
    
    echo -e "${YELLOW}📖 API Documentation:${NC}"
    echo "  Swagger UI: http://localhost:8080/docs"
    echo "  Health Check: http://localhost:8080/health-check"
}

# Function to cleanup (optional)
cleanup() {
    echo -e "${RED}🧹 Cleaning up existing deployment...${NC}"
    kubectl delete -f k8s/ --ignore-not-found=true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Main deployment flow
main() {
    # Parse command line arguments
    if [[ "$1" == "--cleanup" ]]; then
        cleanup
        exit 0
    fi
    
    if [[ "$1" == "--help" ]]; then
        echo "Usage: $0 [--cleanup] [--help]"
        echo "  --cleanup: Remove existing deployment"
        echo "  --help: Show this help message"
        exit 0
    fi
    
    # Pre-flight checks
    check_kubectl
    check_cluster
    
    # Deploy components
    create_namespace
    apply_secrets
    apply_configmap
    deploy_postgres
    deploy_app
    apply_ingress
    apply_hpa
    
    # Show status
    show_status
    show_access_info
}

# Run main function
main "$@"