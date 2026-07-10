import { createDbClient } from "./db-utils";

const db = createDbClient();

await db.transaction.deleteMany({});

await db.$disconnect();
