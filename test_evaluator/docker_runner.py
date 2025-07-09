import docker
import tempfile
import os

def run_in_docker(user_code: str, test_input: str, expected_output: str):
    client = docker.from_env()

    # Save code to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix=".py", delete=False) as code_file:
        code_file.write(user_code)
        code_file.flush()
        host_code_path = code_file.name
        container_code_path = f"/code/{os.path.basename(host_code_path)}"

    try:
        # Write input to a separate file (for clean piping)
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as input_file:
            input_file.write(test_input)
            input_file.flush()
            host_input_path = input_file.name
            container_input_path = f"/input/input.txt"

        command = f"sh -c 'python {container_code_path} < {container_input_path}'"

        output = client.containers.run(
            image="python:3.9",
            command=command,
            volumes={
                host_code_path: {'bind': container_code_path, 'mode': 'ro'},
                host_input_path: {'bind': container_input_path, 'mode': 'ro'}
            },
            stdin_open=True,
            stderr=True,
            stdout=True,
            remove=True,
            network_disabled=True,
            mem_limit="100m",
            user="1000",
            environment={"PYTHONUNBUFFERED": "1"}
        )

        actual = output.decode().strip()
        return {
            "actual_output": actual,
            "passed": actual == expected_output.strip()
        }

    except docker.errors.ContainerError as e:
        return {
            "actual_output": e.stderr.decode().strip() if e.stderr else "Runtime Error",
            "passed": False
        }

    except Exception as e:
        return {
            "actual_output": f"Internal Error: {str(e)}",
            "passed": False
        }

    finally:
        try:
            os.remove(host_code_path)
            os.remove(host_input_path)
        except Exception:
            pass
