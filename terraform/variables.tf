variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  default     = "DESAP"
}

variable "location" {
  description = "Azure region for the resources"
  type        = string
  default     = "Sweden Central"
}

variable "acr_name" {
  description = "Azure Container Registry name"
  type        = string
  default     = "Bombaclat"
}

variable "akc_name" {
  description = "AKC cluster name"
  type        = string
  default     = "Clusterfuck"
}

variable "ara_name" {
  description = "Azure Role Assignment name"
  type        = string
  default     = "Role_Assignment"
}

variable "node_count" {
  description = "Number of nodes in the AKS node pool"
  type        = number
  default     = 1
}

variable "node_vm_size" {
  description = "VM size for the AKS nodes"
  type        = string
  default     = "Standard_B2s"
}

variable "kubernetes_version" {
  default = "1.30.9"
}

