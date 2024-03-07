bring ex;

pub class Table {
  table: ex.DynamodbTable;
  pub name: str;

  new(props: ex.DynamodbTableProps) {
    this.table = new ex.DynamodbTable(props);
    this.name = this.table.name;
  }

  pub onEvent(handler: inflight (str): void) {
    
  }

  pub inflight client(): IAwsClient {
    return Table.dynamoClient(this.table);
  }

  extern "./handlers.ts" static inflight dynamoClient(d: ex.DynamodbTable): IAwsClient;
}

pub interface IAwsClient {
  
}
