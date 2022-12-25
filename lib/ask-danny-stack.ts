import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { aws_certificatemanager, aws_route53, aws_route53_targets, Duration} from 'aws-cdk-lib';
import { CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';

export class PressAiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const handler = new lambda.Function(this, "AskDannyHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("app"),
      timeout: Duration.seconds(30),
      handler: "ask.main",
      environment: {
        OPEN_AI_KEY: process.env.OPEN_AI_KEY || ""
      }
    });

    const hostedZone = aws_route53.HostedZone.fromLookup(this, 'dannylinden_zone', {
      domainName: 'dannylinden.de',
    });

    const certificate = new aws_certificatemanager.Certificate(this, 'ssl-certificate', {
      domainName: 'ask.dannylinden.de',
      validation: CertificateValidation.fromDns(hostedZone)
    });

    const api = new apigateway.RestApi(this, "ask-api", {
      restApiName: "Ask Service",
      description: "This service creates an answer via OpenAI Api",
      domainName: {
        domainName: 'ask.dannylinden.de',
        certificate: certificate,
      },
    });

    const integration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addMethod("GET", integration); // GET /

    new aws_route53.ARecord(this, 'ask-dannylinden-de-a-record', {
      recordName: 'ask.dannylinden.de',
      zone: hostedZone,
      target: aws_route53.RecordTarget.fromAlias(new aws_route53_targets.ApiGateway(api)),
      ttl: Duration.minutes(1)
    });
  }
}
