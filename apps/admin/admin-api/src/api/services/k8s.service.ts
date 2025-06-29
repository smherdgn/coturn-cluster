import { spawn, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const applyYaml = (yaml: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const kubectl = spawn("kubectl", ["apply", "--validate=false", "-f", "-"]);
    kubectl.stdin.write(yaml);
    kubectl.stdin.end();

    let stderr = "";
    kubectl.stderr.on("data", (data) => (stderr += data));

    kubectl.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`kubectl apply failed with code ${code}: ${stderr}`));
    });
  });
};

export const deleteDeployment = (deploymentName: string) => {
  return execAsync(`kubectl delete deployment ${deploymentName}`);
};

export const restartDeployment = (deploymentName: string) => {
  return execAsync(`kubectl rollout restart deployment ${deploymentName}`);
};

export const getPodLogs = async (nodeId: string): Promise<string> => {
  const { stdout: podNameRaw } = await execAsync(
    `kubectl get pods -l node-id=${nodeId} -o jsonpath="{.items[0].metadata.name}"`
  );
  const podName = podNameRaw.trim().replace(/["'\n\r]/g, "");
  if (!podName) throw new Error("Pod not found");

  const { stdout, stderr } = await execAsync(
    `kubectl logs ${podName} --tail=500`
  );
  return stdout + "\n" + stderr;
};
