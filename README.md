# Helm Apply Tool
[![Build Status](https://travis-ci.org/OleConsignado/helm-apply.svg?branch=master)](https://travis-ci.org/OleConsignado/helm-apply)

**Helm Apply Tool** is a command line tool designed to perform install and upgrade operations for Kubernetes Helm based configuration APPs hosted in a Version Control System (curretly supports Git and TFS).

## Install

### Dependencies

* git 
* tf (tested with TEE-CLC-14.123.1)

Use npm:

```
$ npm install helm-apply -g
```

Create a file named `.helm-apply.yaml` in your home directory with contents similar to:
```yaml
git:
  localPathBase: "/home/matheus/.helm-apply/git"
  credentials:
    https://xxx.visualstudio.com: XXX
tfs:
  tfCommand: "/opt/TEE-CLC-14.123.1/tf"
  collections:
  - url: https://xxx.visualstudio.com
    user: _
    passwd: XXX
    workspace:
      name: helm-apply-test
      localPathBase: "/home/matheus/.helm-apply/tfs"
    isDefaultCollection: true
```

## Usage

```
$ helm-apply --namespace=target-namespace --spec=specs-file.yaml --all|--app=app-name
```

`specs-file.yaml` should looks like:
```yaml
globalValues:
  parentDomain: k8s01.com.br
  dockerRegistrationSecret: docker-reg
apps:
- name: segurancaapi
  source: $/MyProj/trunk/MyProj.Service/Kubernetes.Helm;C17583
  values:
    cpuLimit: 500m
```
