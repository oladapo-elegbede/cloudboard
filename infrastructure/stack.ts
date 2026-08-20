import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

export class CloudBoardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "CloudBoardVpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { cidrMask: 24, name: "Public", subnetType: ec2.SubnetType.PUBLIC },
        { cidrMask: 24, name: "Private", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });

    const dbSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "DbSecret",
      "cloudboard/database-password",
    );

    const database = new rds.DatabaseInstance(this, "CloudBoardDb", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      databaseName: "cloudboard",
      credentials: rds.Credentials.fromPassword("cloudboard", dbSecret.secretValue),
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      deletionProtection: false,
      backupRetention: cdk.Duration.days(7),
    });

    const jwtSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "JwtSecret",
      "cloudboard/jwt-access-secret",
    );

    const cluster = new ecs.Cluster(this, "CloudBoardCluster", {
      vpc,
      clusterName: "cloudboard",
    });

    const apiImage = new ecr_assets.DockerImageAsset(this, "CloudBoardApiImage", {
      directory: "../",
      file: "apps/api/Dockerfile",
      target: "production",
    });

    const apiService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "CloudBoardApi",
      {
        cluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromDockerImageAsset(apiImage),
          containerPort: 3000,
          environment: {
            NODE_ENV: "production",
            PORT: "3000",
            ALLOWED_ORIGINS: "https://cloudboard.example.com",
            JWT_ACCESS_EXPIRY: "15m",
            JWT_REFRESH_EXPIRY_DAYS: "30",
          },
          secrets: {
            JWT_ACCESS_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
          },
        },
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: 1,
        publicLoadBalancer: true,
        assignPublicIp: false,
      },
    );

    database.connections.allowDefaultPortFrom(apiService.service);

    apiService.targetGroup.configureHealthCheck({
      path: "/health",
      healthyHttpCodes: "200",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: apiService.loadBalancer.loadBalancerDnsName,
      description: "API Load Balancer URL",
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: database.instanceEndpoint.hostname,
      description: "RDS PostgreSQL endpoint",
    });
  }
}

const app = new cdk.App();
new CloudBoardStack(app, "CloudBoardStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
});
