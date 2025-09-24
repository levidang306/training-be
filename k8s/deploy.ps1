# Task Management Backend - Kubernetes Deployment
# PowerShell deployment script for Windows

param(
    [switch]$Cleanup,
    [switch]$Help
)

# Configuration
$NAMESPACE = "task-management"
$APP_NAME = "task-management-app"
$IMAGE_NAME = "task-management-be"
$IMAGE_TAG = "latest"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Show-Help {
    Write-Output "Usage: .\deploy.ps1 [-Cleanup] [-Help]"
    Write-Output "  -Cleanup: Remove existing deployment"
    Write-Output "  -Help: Show this help message"
}

function Test-KubectlAvailable {
    try {
        kubectl version --client | Out-Null
        Write-Success "kubectl is available"
        return $true
    }
    catch {
        Write-Error "kubectl is not installed. Please install kubectl first."
        return $false
    }
}

function Test-ClusterConnection {
    try {
        kubectl cluster-info | Out-Null
        Write-Success "Kubernetes cluster is accessible"
        return $true
    }
    catch {
        Write-Error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        return $false
    }
}

function New-Namespace {
    try {
        kubectl get namespace $NAMESPACE | Out-Null
        Write-Warning "Namespace $NAMESPACE already exists"
    }
    catch {
        kubectl apply -f k8s/namespace.yaml
        Write-Success "Namespace $NAMESPACE created"
    }
}

function Deploy-Secrets {
    Write-Info "Applying secrets..."
    kubectl apply -f k8s/secret.yaml
    Write-Success "Secrets applied"
}

function Deploy-ConfigMap {
    Write-Info "Applying configmap..."
    kubectl apply -f k8s/configmap.yaml
    Write-Success "ConfigMap applied"
}

function Deploy-PostgreSQL {
    Write-Info "Deploying PostgreSQL..."
    kubectl apply -f k8s/postgres.yaml
    
    Write-Info "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
    Write-Success "PostgreSQL is ready"
}

function Deploy-Application {
    Write-Info "Deploying application..."
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    
    Write-Info "Waiting for application to be ready..."
    kubectl wait --for=condition=available deployment/$APP_NAME -n $NAMESPACE --timeout=300s
    Write-Success "Application is ready"
}

function Deploy-Ingress {
    Write-Info "Applying ingress..."
    kubectl apply -f k8s/ingress.yaml
    Write-Success "Ingress applied"
}

function Deploy-HPA {
    Write-Info "Applying HPA..."
    kubectl apply -f k8s/hpa.yaml
    Write-Success "HPA applied"
}

function Show-DeploymentStatus {
    Write-ColorOutput Green "📊 Deployment Status:"
    Write-Output ""
    kubectl get all -n $NAMESPACE
    Write-Output ""
    Write-ColorOutput Green "🔍 Pod Details:"
    kubectl get pods -n $NAMESPACE -o wide
    Write-Output ""
    Write-ColorOutput Green "🌐 Services:"
    kubectl get svc -n $NAMESPACE
    Write-Output ""
    Write-ColorOutput Green "🚪 Ingress:"
    kubectl get ingress -n $NAMESPACE
}

function Show-AccessInfo {
    Write-Output ""
    Write-ColorOutput Green "🎉 Deployment Complete!"
    Write-Output ""
    Write-ColorOutput Yellow "📋 Access Information:"
    
    # NodePort access
    $nodePort = kubectl get svc task-management-nodeport -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}'
    Write-ColorOutput Green "NodePort Access:"
    Write-Output "  http://<NODE_IP>:$nodePort"
    Write-Output ""
    
    # Ingress access
    Write-ColorOutput Green "Ingress Access:"
    Write-Output "  Add to C:\Windows\System32\drivers\etc\hosts: <INGRESS_IP> task-management-api.local"
    Write-Output "  Then access: http://task-management-api.local"
    Write-Output ""
    
    # Port forward access
    Write-ColorOutput Green "Local Port Forward:"
    Write-Output "  kubectl port-forward svc/task-management-service 8080:80 -n $NAMESPACE"
    Write-Output "  Then access: http://localhost:8080"
    Write-Output ""
    
    Write-ColorOutput Yellow "📖 API Documentation:"
    Write-Output "  Swagger UI: http://localhost:8080/docs"
    Write-Output "  Health Check: http://localhost:8080/health-check"
}

function Remove-Deployment {
    Write-Info "Cleaning up existing deployment..."
    kubectl delete -f k8s/ --ignore-not-found=true
    Write-Success "Cleanup complete"
}

function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    if ($Cleanup) {
        Remove-Deployment
        return
    }
    
    Write-ColorOutput Green "🚀 Starting Task Management Backend Deployment"
    Write-Output ""
    
    # Pre-flight checks
    if (-not (Test-KubectlAvailable)) { return }
    if (-not (Test-ClusterConnection)) { return }
    
    try {
        # Deploy components
        New-Namespace
        Deploy-Secrets
        Deploy-ConfigMap
        Deploy-PostgreSQL
        Deploy-Application
        Deploy-Ingress
        Deploy-HPA
        
        # Show status
        Show-DeploymentStatus
        Show-AccessInfo
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Write-Info "Check the logs with: kubectl logs -f deployment/$APP_NAME -n $NAMESPACE"
    }
}

# Run main function
Main