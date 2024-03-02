import { Construct } from "constructs";
import {
	HttpApi,
	HttpMethod,
	type IHttpApi,
} from "aws-cdk-lib/aws-apigatewayv2";
import { type ITableV2 } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export interface ApiProps {
	readonly transactionsTable: ITableV2;
	readonly streamsTable: ITableV2;
}

export class Api extends Construct {
	readonly httpApi: IHttpApi;

	constructor(scope: Construct, id: string, props: ApiProps) {
		super(scope, id);

		const httpApi = new HttpApi(this, "api");

		const appendToStreamHandler = new NodejsFunction(
			this,
			"append-to-stream-handler",
			{
				entry: `${import.meta.dirname}/api.append-to-stream-handler.ts`,
				bundling: {
					format: OutputFormat.ESM,
					// platform: "node",
					// target: "node20",
					mainFields: ["module", "main"],
				},
			},
		);
		appendToStreamHandler.addEnvironment(
			"TRANSACTIONS_TABLE_NAME",
			props.transactionsTable.tableName,
		);
		props.transactionsTable.grantReadWriteData(appendToStreamHandler);

		httpApi.addRoutes({
			path: "/append-to-stream",
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration(
				"append-to-stream-handler-integration",
				appendToStreamHandler,
			),
		});

		const readStreamHandler = new NodejsFunction(this, "ReadStreamHandler", {
			entry: `${import.meta.dirname}/api.read-stream-handler.ts`,
			bundling: {
				format: OutputFormat.ESM,
				// platform: "node",
				// target: "node20",
				mainFields: ["module", "main"],
			},
		});
		readStreamHandler.addEnvironment(
			"STREAMS_TABLE_NAME",
			props.streamsTable.tableName,
		);
		props.streamsTable.grantReadWriteData(readStreamHandler);

		httpApi.addRoutes({
			path: "/read-stream",
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration(
				"ReadStreamIntegration",
				readStreamHandler,
			),
		});

		this.httpApi = httpApi;
	}
}
