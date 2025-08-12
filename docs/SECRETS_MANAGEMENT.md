# Secrets Management Guide

This document provides comprehensive guidance on managing secrets, API keys, and sensitive configuration data securely in the Africycle project.

## Overview

Proper secrets management is critical for the security of the Africycle platform. This guide covers best practices for handling sensitive data across development, staging, and production environments.

## What Are Secrets?

Secrets are sensitive pieces of information that should be kept confidential, including:

- **Private Keys** - Blockchain wallet private keys
- **API Keys** - Third-party service API credentials
- **Database Credentials** - Database usernames and passwords
- **JWT Secrets** - Authentication token signing keys
- **OAuth Secrets** - OAuth client secrets
- **Encryption Keys** - Data encryption/decryption keys
- **Service Account Keys** - Cloud service account credentials

## Security Principles

### 1. Never Commit Secrets to Version Control
- ❌ Never commit `.env` files containing real secrets
- ❌ Never commit private keys or API keys
- ❌ Never commit database credentials
- ✅ Use `.env.example` files with placeholder values
- ✅ Use `.gitignore` to exclude sensitive files

### 2. Use Environment-Specific Configuration
- **Development**: Local `.env` files (not committed)
- **Staging**: Environment variables or secure config management
- **Production**: Dedicated secrets management service

### 3. Principle of Least Privilege
- Grant minimum required permissions
- Rotate credentials regularly
- Use different credentials for different environments

### 4. Defense in Depth
- Encrypt secrets at rest
- Encrypt secrets in transit
- Use secure key management services
- Implement access logging and monitoring

## Development Environment

### Local Development Setup

1. **Copy Environment Template**
   ```bash
   cp docker.env.example .env
   cp packages/react-app/.env.example packages/react-app/.env
   cp packages/hardhat/.env.example packages/hardhat/.env
   ```

2. **Edit Environment Files**
   - Replace all placeholder values with your actual credentials
   - Never commit these files to version control
   - Use strong, unique passwords

3. **Generate Secure Secrets**
   ```bash
   # Generate JWT secret
   openssl rand -base64 32
   
   # Generate database password
   openssl rand -base64 16
   
   # Generate Grafana password
   openssl rand -base64 12
   ```

### Development Best Practices

1. **Use Strong Passwords**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Avoid common patterns

2. **Separate Development and Production**
   - Use different API keys for development
   - Use testnet for blockchain development
   - Use separate database instances

3. **Regular Rotation**
   - Rotate development credentials monthly
   - Update API keys when compromised
   - Change passwords after team member departure

## Staging Environment

### Configuration Management

1. **Environment Variables**
   ```bash
   # Set environment variables
   export POSTGRES_PASSWORD="$(openssl rand -base64 16)"
   export JWT_SECRET="$(openssl rand -base64 32)"
   export PRIVATE_KEY="your-staging-private-key"
   ```

2. **Docker Secrets** (if using Docker Swarm)
   ```bash
   # Create secrets
   echo "your-secret" | docker secret create postgres_password -
   echo "your-jwt-secret" | docker secret create jwt_secret -
   ```

3. **Configuration Files**
   - Store configuration in secure, encrypted files
   - Use configuration management tools
   - Implement access controls

### Staging Security

1. **Access Control**
   - Limit access to staging environment
   - Use VPN or private networks
   - Implement IP whitelisting

2. **Monitoring**
   - Log all access attempts
   - Monitor for suspicious activity
   - Set up alerts for security events

## Production Environment

### Recommended Secrets Management Services

#### 1. HashiCorp Vault
```bash
# Install Vault
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install vault

# Start Vault server
vault server -dev

# Store secrets
vault kv put secret/africycle/database password=your-secure-password
vault kv put secret/africycle/jwt secret=your-jwt-secret
vault kv put secret/africycle/private_key key=your-private-key
```

#### 2. AWS Secrets Manager
```bash
# Store secrets
aws secretsmanager create-secret \
    --name "africycle/database" \
    --description "Database credentials" \
    --secret-string '{"username":"africycle","password":"your-secure-password"}'

# Retrieve secrets
aws secretsmanager get-secret-value --secret-id "africycle/database"
```

#### 3. Azure Key Vault
```bash
# Create key vault
az keyvault create --name africycle-vault --resource-group africycle-rg --location eastus

# Store secrets
az keyvault secret set --vault-name africycle-vault --name "database-password" --value "your-secure-password"
az keyvault secret set --vault-name africycle-vault --name "jwt-secret" --value "your-jwt-secret"
```

#### 4. Google Cloud Secret Manager
```bash
# Create secrets
echo -n "your-secure-password" | gcloud secrets create database-password --data-file=-

# Access secrets
gcloud secrets versions access latest --secret="database-password"
```

### Production Deployment

#### Docker Compose with Secrets
```yaml
version: '3.8'
services:
  app:
    image: africycle/app
    environment:
      - DATABASE_URL=postgresql://africycle:${POSTGRES_PASSWORD}@postgres:5432/africycle
      - JWT_SECRET=${JWT_SECRET}
    secrets:
      - postgres_password
      - jwt_secret
      - private_key

secrets:
  postgres_password:
    external: true
  jwt_secret:
    external: true
  private_key:
    external: true
```

#### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: africycle-secrets
type: Opaque
data:
  postgres-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-jwt-secret>
  private-key: <base64-encoded-private-key>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: africycle-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: africycle/app
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: africycle-secrets
              key: postgres-password
```

### Production Security Checklist

- [ ] Use dedicated secrets management service
- [ ] Encrypt all secrets at rest and in transit
- [ ] Implement access logging and monitoring
- [ ] Set up automated secret rotation
- [ ] Use different secrets for each environment
- [ ] Implement least privilege access
- [ ] Regular security audits
- [ ] Backup and disaster recovery plan
- [ ] Incident response procedures
- [ ] Compliance with relevant regulations

## CI/CD Pipeline Security

### GitHub Actions Secrets

1. **Store Secrets in GitHub**
   - Go to repository Settings > Secrets and variables > Actions
   - Add secrets for each environment

2. **Use Secrets in Workflows**
   ```yaml
   name: Deploy to Production
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
       - name: Deploy
         env:
           PRIVATE_KEY: ${{ secrets.PRODUCTION_PRIVATE_KEY }}
           DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
           JWT_SECRET: ${{ secrets.PRODUCTION_JWT_SECRET }}
         run: |
           # Deployment script
   ```

### GitLab CI/CD Variables

1. **Store Variables in GitLab**
   - Go to Settings > CI/CD > Variables
   - Add variables with appropriate protection

2. **Use Variables in Pipeline**
   ```yaml
   deploy_production:
     stage: deploy
     script:
       - echo "Deploying to production"
       - echo $PRODUCTION_PRIVATE_KEY
     only:
       - main
   ```

## Monitoring and Alerting

### Secret Access Monitoring

1. **Log All Access**
   ```bash
   # Vault audit logging
   vault audit enable file file_path=/var/log/vault-audit.log
   
   # AWS CloudTrail
   aws cloudtrail create-trail --name africycle-trail --s3-bucket-name africycle-logs
   ```

2. **Set Up Alerts**
   - Unusual access patterns
   - Failed authentication attempts
   - Secret rotation events
   - Configuration changes

### Security Metrics

- Number of active secrets
- Secret rotation frequency
- Access attempt success/failure rates
- Time to detect and respond to incidents

## Incident Response

### Secret Compromise Response

1. **Immediate Actions**
   - Revoke compromised credentials
   - Rotate all related secrets
   - Investigate the breach
   - Notify affected parties

2. **Investigation**
   - Review access logs
   - Identify root cause
   - Assess impact
   - Document findings

3. **Recovery**
   - Deploy new secrets
   - Update applications
   - Verify security
   - Monitor for further issues

### Response Playbook

```bash
#!/bin/bash
# Secret compromise response script

echo "🚨 SECRET COMPROMISE DETECTED 🚨"
echo "1. Revoking compromised credentials..."
echo "2. Rotating all related secrets..."
echo "3. Investigating breach..."
echo "4. Notifying stakeholders..."
echo "5. Deploying new secrets..."
echo "6. Verifying security..."
```

## Compliance and Regulations

### GDPR Compliance
- Encrypt personal data
- Implement data retention policies
- Provide data subject rights
- Maintain audit trails

### SOC 2 Compliance
- Access controls
- Change management
- Risk assessment
- Security monitoring

### Industry Standards
- NIST Cybersecurity Framework
- ISO 27001
- PCI DSS (if handling payment data)

## Tools and Resources

### Secret Management Tools
- **HashiCorp Vault** - Open source secrets management
- **AWS Secrets Manager** - Cloud-native secrets management
- **Azure Key Vault** - Microsoft cloud secrets management
- **Google Cloud Secret Manager** - Google cloud secrets management
- **Docker Secrets** - Docker native secrets management
- **Kubernetes Secrets** - Kubernetes native secrets management

### Security Tools
- **OpenSSL** - Generate secure random values
- **GPG** - Encrypt sensitive files
- **Ansible Vault** - Encrypt configuration files
- **Terraform** - Infrastructure as code with secrets

### Monitoring Tools
- **Prometheus** - Metrics collection
- **Grafana** - Visualization and alerting
- **ELK Stack** - Log aggregation and analysis
- **Splunk** - Security information and event management

## Best Practices Summary

1. **Never commit secrets to version control**
2. **Use dedicated secrets management services**
3. **Implement least privilege access**
4. **Rotate secrets regularly**
5. **Monitor and log all access**
6. **Encrypt secrets at rest and in transit**
7. **Use different secrets for different environments**
8. **Implement automated secret rotation**
9. **Have incident response procedures**
10. **Regular security audits and testing**

## Conclusion

Proper secrets management is essential for the security and success of the Africycle platform. By following these guidelines and implementing the recommended practices, we can ensure that sensitive information remains secure while maintaining operational efficiency.

Remember: Security is not a one-time effort but an ongoing process that requires vigilance, regular updates, and continuous improvement.

---

*This document should be reviewed and updated regularly to reflect current best practices and security requirements.* 