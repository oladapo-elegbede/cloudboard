# CloudBoard — AWS Cost Estimation

Estimated monthly costs for running CloudBoard on AWS. All prices are approximate US East (N. Virginia) region prices as of 2026.

---

## Minimum Viable Deployment

For a small team (< 50 users, light usage):

| Service         | Configuration                 | Monthly Cost   |
| --------------- | ----------------------------- | -------------- |
| ECS Fargate     | 1 task, 0.25 vCPU, 0.5 GB RAM | $9             |
| RDS PostgreSQL  | db.t3.micro, 20 GB storage    | $15            |
| ALB             | Application Load Balancer     | $16            |
| ECR             | Container registry, < 1 GB    | $0.10          |
| Secrets Manager | 2 secrets                     | $0.80          |
| NAT Gateway     | 1 AZ                          | $32            |
| CloudWatch      | Basic logging                 | $0 (free tier) |
| **Total**       |                               | **~$73/month** |

### Cost Optimization Notes

- **NAT Gateway is the biggest cost** ($32/month). For dev/staging, you can use a NAT Instance ($3/month) or put ECS in a public subnet (less secure but cheaper).
- **RDS can be reduced** by using Aurora Serverless v2 which scales to zero when idle.
- **ALB is fixed cost** regardless of traffic. For very low traffic, API Gateway + Lambda would be cheaper.

---

## Production Deployment

For a growing team (50-500 users, moderate usage):

| Service         | Configuration                        | Monthly Cost    |
| --------------- | ------------------------------------ | --------------- |
| ECS Fargate     | 2 tasks, 0.5 vCPU, 1 GB RAM each     | $36             |
| RDS PostgreSQL  | db.t3.small, 50 GB storage, Multi-AZ | $50             |
| ALB             | Application Load Balancer            | $16             |
| ECR             | Container registry                   | $1              |
| Secrets Manager | 5 secrets                            | $2              |
| NAT Gateway     | 2 AZs                                | $64             |
| CloudWatch      | Enhanced logging + alarms            | $5              |
| S3 + CloudFront | Frontend hosting                     | $5              |
| Route 53        | DNS                                  | $0.50           |
| ACM             | SSL certificate                      | $0 (free)       |
| **Total**       |                                      | **~$180/month** |

---

## Cost Reduction Strategies

1. **Use Fargate Spot** for non-critical workloads (up to 70% savings)
2. **Reserved capacity** for predictable workloads (up to 40% savings on Fargate)
3. **Aurora Serverless v2** instead of RDS for variable workloads
4. **Remove NAT Gateway** in dev/staging environments
5. **Use Vercel free tier** for frontend instead of S3+CloudFront
6. **Set billing alerts** at $50 and $100 to catch unexpected costs

---

## Free Tier Considerations

New AWS accounts get 12 months of free tier:

- 750 hours/month of t3.micro EC2 (not Fargate)
- 750 hours/month of RDS db.t3.micro
- 5 GB S3 storage
- 1 million Lambda invocations

To maximize free tier, use EC2 instead of Fargate and keep RDS at db.t3.micro.

---

## Billing Alerts

Set up billing alerts BEFORE deploying: aws cloudwatch put-metric-alarm
--alarm-name "CloudBoard-MonthlyBudget-50"
--metric-name EstimatedCharges
--namespace AWS/Billing
--statistic Maximum
--period 86400
--threshold 50
--comparison-operator GreaterThanThreshold
--evaluation-periods 1
--alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alerts

text
