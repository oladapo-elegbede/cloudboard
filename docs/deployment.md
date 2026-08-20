# CloudBoard — AWS Deployment Guide

This document describes how to deploy CloudBoard to AWS using the infrastructure defined in this repository.

---

## Architecture Overview

Internet
|
v
[CloudFront] --> [S3] (Next.js static frontend)
|
v
[ALB] (Application Load Balancer)
|
v
[ECS Fargate] (API containers, private subnet)
|
v
[RDS PostgreSQL] (managed database, private subnet)

text

**VPC Layout:**

- Public subnets: ALB, NAT Gateway
- Private subnets: ECS tasks, RDS instance
- No direct internet access to API or database

---

## Prerequisites

1. AWS account with billing configured
2. AWS CLI v2 installed and configured (`aws configure`)
3. AWS CDK v2 installed (`npm install -g aws-cdk`)
4. Docker installed (for building container images)
5. A registered domain name (optional but recommended)

---

## Step 1 — Bootstrap CDK

First-time CDK setup for your AWS account:
cdk bootstrap aws://ACCOUNT_ID/REGION

text

Replace ACCOUNT_ID and REGION with your values.

---

## Step 2 — Configure Secrets

Create the required secrets in AWS Secrets Manager:
aws secretsmanager create-secret
--name cloudboard/jwt-access-secret
--secret-string "$(openssl rand -base64 48)"

aws secretsmanager create-secret
--name cloudboard/database-password
--secret-string "$(openssl rand -base64 24)"

text

---

## Step 3 — Deploy Infrastructure

cd infrastructure
npm install
cdk deploy --all

text

CDK will:

1. Create a VPC with public and private subnets
2. Create an RDS PostgreSQL instance in private subnet
3. Create an ECS Fargate cluster
4. Build and push the Docker image to ECR
5. Create an ECS service with the API container
6. Create an ALB in the public subnet pointing to the ECS service
7. Output the ALB URL

---

## Step 4 — Run Database Migrations

After infrastructure is created, run migrations against the production database: Get the database URL from Secrets Manager or CDK outputs
Then run:
DATABASE_URL=postgresql://cloudboard:PASSWORD@RDS_ENDPOINT:5432/cloudboard npx prisma migrate deploy

text

Note: use `migrate deploy` (not `migrate dev`) in production. This applies existing migrations without creating new ones.

---

## Step 5 — Deploy Frontend

**Option A — Vercel (recommended for Next.js):**

1. Connect your GitHub repo to Vercel
2. Set `NEXT_PUBLIC_API_URL` to your ALB URL
3. Deploy

**Option B — S3 + CloudFront:**

1. Build the frontend: `cd apps/web && npm run build`
2. Upload the output to S3
3. CloudFront serves it globally

---

## Step 6 — Verify

curl https://your-domain.com/api/v1/health

text

Should return `{"success":true,"data":{"status":"ok"}}`.

---

## Rollback

To destroy all infrastructure:
cd infrastructure
cdk destroy --all

text

This removes all AWS resources. Data in RDS will be lost unless snapshots are enabled.

---

## Security Checklist

- [ ] JWT secret stored in Secrets Manager (never in code or env files)
- [ ] Database in private subnet (not internet-accessible)
- [ ] CORS configured for production frontend domain only
- [ ] HTTPS enforced via ALB certificate
- [ ] Security groups restrict access (API only from ALB, DB only from API)
- [ ] IAM roles use least-privilege principle
- [ ] Database credentials rotated via Secrets Manager
- [ ] Container runs as non-root user
- [ ] No debug logs in production (NODE_ENV=production)
