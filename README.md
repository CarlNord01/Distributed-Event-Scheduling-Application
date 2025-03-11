# Distributed Event Scheduler PRO
A web application for scheduling and managing events, built using the MERN stack (MongoDB, Express, React, Node.js) using Create React App. We will also deploy the application on the clod and make it scalable and fault tolerant using Azure.

# Group Number:
Group 13

---

## Contributors:

- Jesper\
  Username: Kiopp

- Axel\
  Username: Vencilo

- Carl\
  Username: CarlNord01

---

## What We Will Implement:
We will modify the event scheduling application to be scalable and fault tolerant.

The languages we are going to use are:
- JavaScript
- HTML
- CSS
- HCL

## Technologies Used:
- **MERN Stack**: MongoDB, Express, React, Node.js
- **Create React App**: For setting up the React application.
- **Node.js**: Version 20.17.0 LTS (Ensure the installed version of Node.js is compatible with this version.)
- **Material UI** and **Material UI X**: For UI components and styling.
- **Microsoft Azure** for cloud distribution
- **Kubernetes** for containerization
- **Terraform** for deploying everything on Azure

## How to Compile and Run:

## Prerequisites

- **Node.js:** Ensure you have Node.js installed (compatible with version 20.17.0 LTS). Download it from the [Node.js Official Website](https://nodejs.org/).
- **Terraform:** Install Terraform. See the [Terraform Downloads](https://www.terraform.io/downloads.html) page.
- **Kubernetes:** Install Kubernetes command-line tool. See the [Kubernetes Downloads](https://kubernetes.io/docs/tasks/tools/) page.
- **Azure CLI:** Install the Azure CLI. Follow the instructions on the [Azure CLI Installation Page](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).
- **Azure Account:** Make sure you have an active Azure subscription.

## Deployment Instructions

1. **Download the Code:**

   You can obtain the repository in one of two ways:

   - **Clone the Repository:**
     ```bash
     git clone https://github.com/CarlNord01/Distributed-Event-Scheduling-Application.git
     ```
   - **Download ZIP:**  
     Click the "Download ZIP" button on the GitHub repository page.

2. **Install Node.js:**

   Verify that Node.js is installed and that the version is compatible with version 20.17.0 LTS.

3. **Install Terraform:**

   Follow the installation instructions available at [Terraform Downloads](https://www.terraform.io/downloads.html).

4. **Install Azure CLI:**

   Follow the installation guide on the [Azure CLI Installation Page](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).

5. **Run Terraform Apply:**

   In your terminal, navigate to the Terraform configuration directory within the repository and run:
   ```bash
   terraform apply
6. **Get Kube.config:**

   After the deployment, retrieve your kube.config file to connect to your Kubernetes cluster.

7. **Fix Secrets:**

    Update and configure the required secrets. In the GitHub repository, ensure the following secrets are set:
     - CONTAINER_REGISTRY_LOGIN_SERVER
     - CONTAINER_REGISTRY_PASSWORD
     - CONTAINER_REGISTRY_USERNAME
     - KUBE_CONFIG (needs base64 encryption)
   
    Additionally, set up Kubernetes secrets for MongoDB credentials (username and password).

 8. **Change IP Addresses in Code:**

    Update any hard-coded IP addresses in the code to match your Azure deployment configuration.
      - Change all IP adresses in event-app to the current gateway IP adress.
      - Change origin IP adress in gateway to current event-app IP adress.
      - Change respective createDynamicProxy IP adress in gateway to correct clusterIP for each micro service.
      

## License
This project is licensed under the MIT License.
