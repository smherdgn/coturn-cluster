import { db } from "../../database/client";

interface ClusterConfigRow {
  config_key: string;
  config_value: string;
}

interface ConfigObject {
  [key: string]: string;
}

export const getConfig = async () => {
  const result = await db.query(
    "SELECT config_key, config_value FROM cluster_config"
  );

  const configObject: ConfigObject = result.rows.reduce(
    (acc: ConfigObject, row: ClusterConfigRow) => {
      acc[row.config_key] = row.config_value;
      return acc;
    },
    {}
  );
  return configObject;
};

export const updateConfig = async (configData: Record<string, string>) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    for (const [key, value] of Object.entries(configData)) {
      await client.query(
        "UPDATE cluster_config SET config_value = $1, updated_at = NOW() WHERE config_key = $2",
        [value, key]
      );
    }
    await client.query("COMMIT");
    return { success: true, message: "Configuration updated." };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
