#!/bin/bash
echo "☸️  Deploying to Kubernetes..."

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/admin-deployment.yaml
kubectl apply -f k8s/coturn-deployment.yaml
kubectl apply -f k8s/hpa.yaml

# Check status
kubectl get pods -n coturn-system

echo "✅ Deployed to Kubernetes!"
