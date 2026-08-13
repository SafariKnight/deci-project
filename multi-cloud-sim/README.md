# Multi-Cloud Namespace Simulation

This directory contains Kubernetes manifests for simulating workloads across two isolated namespaces: `aws-simulation` and `gcp-simulation`.

## Prerequisites

- Kubernetes cluster (e.g., `kind`, `k3s`, or cloud provider)
- `kubectl` configured to communicate with your cluster

## Apply the Manifests

```bash
kubectl apply -f manifests.yaml
```

This creates:

### Namespaces
- `aws-simulation`
- `gcp-simulation`

### Resources per namespace
Each namespace contains:
1. **Frontend Pod** (`frontend`) — serves a static page via `nginx:alpine`
2. **Backend Pod** (`backend`) — serves a static page via `httpd:alpine`
3. **Frontend Service** (`frontend-service`) — ClusterIP on port 80
4. **Backend Service** (`backend-service`) — ClusterIP on port 80

## Verify the Services Respond

Port-forward into each namespace and `curl` the services. They must actually respond — not just appear in listings.

### AWS Simulation

```bash
# Port-forward frontend
kubectl port-forward svc/frontend-service 8080:80 -n aws-simulation &
# Port-forward backend
kubectl port-forward svc/backend-service 8081:80 -n aws-simulation &
# Wait for port-forwards to be ready
sleep 3
# Test
curl -s http://localhost:8080 | head -5
curl -s http://localhost:8081 | head -5
# Clean up
pkill -f "kubectl port-forward.*aws-simulation"
```

### GCP Simulation

```bash
# Port-forward frontend
kubectl port-forward svc/frontend-service 8082:80 -n gcp-simulation &
# Port-forward backend
kubectl port-forward svc/backend-service 8083:80 -n gcp-simulation &
# Wait for port-forwards to be ready
sleep 3
# Test
curl -s http://localhost:8082 | head -5
curl -s http://localhost:8083 | head -5
# Clean up
pkill -f "kubectl port-forward.*gcp-simulation"
```

## Verify Namespace Isolation

Resources in one namespace are not visible from the other.

```bash
# List pods in AWS namespace
kubectl get pods -n aws-simulation

# List pods in GCP namespace
kubectl get pods -n gcp-simulation

# Verify cross-namespace isolation
# (should return no results):
kubectl get pods -n aws-simulation -l environment=gcp
kubectl get pods -n gcp-simulation -l environment=aws
```
