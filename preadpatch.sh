#!/bin/bash
# === ENHANCED INTELLIGENCE MODULES ===

# 📖 README Intelligence Analysis
analyze_readme_intelligence() {
    echo -e "${CYAN}📖 Analyzing README intelligence...${NC}"
    
    local CONTENT_QUALITY="poor"
    local PURPOSE_CLARITY="unclear"
    local SETUP_INSTRUCTIONS=false
    local API_DOCS=false
    local CONTRIBUTING=false
    
    if [[ -f README.md ]]; then
        local README_CONTENT=$(cat README.md)
        local README_LENGTH=${#README_CONTENT}
        local LINE_COUNT=$(wc -l < README.md)
        
        # Content quality assessment
        if [[ $README_LENGTH -gt 2000 && $LINE_COUNT -gt 50 ]]; then
            CONTENT_QUALITY="excellent"
        elif [[ $README_LENGTH -gt 1000 && $LINE_COUNT -gt 25 ]]; then
            CONTENT_QUALITY="good"
        elif [[ $README_LENGTH -gt 500 && $LINE_COUNT -gt 10 ]]; then
            CONTENT_QUALITY="fair"
        fi
        
        # Purpose clarity
        if echo "$README_CONTENT" | grep -qi "## about\|## overview\|## description\|## what.*does\|## purpose"; then
            PURPOSE_CLARITY="clear"
        elif echo "$README_CONTENT" | grep -qi "# .*\|## .*" | head -3 | grep -qi "what\|how\|why\|platform\|application\|service\|tool"; then
            PURPOSE_CLARITY="moderate"
        fi
        
        # Setup instructions
        if echo "$README_CONTENT" | grep -qi "## installation\|## setup\|## getting started\|## quick start\|npm install\|yarn install\|pip install"; then
            SETUP_INSTRUCTIONS=true
        fi
        
        # API documentation
        if echo "$README_CONTENT" | grep -qi "## api\|## endpoints\|## routes\|/api/\|GET \|POST \|PUT \|DELETE "; then
            API_DOCS=true
        fi
        
        # Contributing guidelines
        if echo "$README_CONTENT" | grep -qi "## contributing\|## development\|## contributing guidelines\|pull request\|code of conduct"; then
            CONTRIBUTING=true
        fi
    fi
    
    update_json '.enhanced_analysis.readme_intelligence.content_quality' "\"$CONTENT_QUALITY\""
    update_json '.enhanced_analysis.readme_intelligence.project_purpose_clarity' "\"$PURPOSE_CLARITY\""
    update_json '.enhanced_analysis.readme_intelligence.setup_instructions' "$SETUP_INSTRUCTIONS"
    update_json '.enhanced_analysis.readme_intelligence.api_documentation' "$API_DOCS"
    update_json '.enhanced_analysis.readme_intelligence.contributing_guidelines' "$CONTRIBUTING"
}

# ☁️ Deployment Intelligence Analysis
analyze_deployment_intelligence() {
    echo -e "${CYAN}☁️ Analyzing deployment intelligence...${NC}"
    
    local KUBERNETES_CONFIG=false
    local CLOUD_PROVIDER="none"
    local CONTAINER_ORCHESTRATION="none"
    local DEPLOYMENT_STRATEGY="unknown"
    local ENV_CONFIGS=()
    
    # Kubernetes detection
    if [[ -d k8s ]] || [[ -d kubernetes ]] || [[ -f deployment.yaml ]] || [[ -f service.yaml ]]; then
        KUBERNETES_CONFIG=true
        CONTAINER_ORCHESTRATION="Kubernetes"
    fi
    
    # Find k8s files
    local K8S_FILES=$(find . -name "*.yaml" -o -name "*.yml" | xargs grep -l "apiVersion\|kind:" 2>/dev/null | wc -l)
    if [[ $K8S_FILES -gt 0 ]]; then
        KUBERNETES_CONFIG=true
        CONTAINER_ORCHESTRATION="Kubernetes"
    fi
    
    # Cloud provider detection
    if [[ -f package.json ]]; then
        if jq -e '.dependencies["@aws-sdk/*"] // .dependencies["aws-sdk"]' package.json >/dev/null 2>&1; then
            CLOUD_PROVIDER="AWS"
        elif jq -e '.dependencies["@google-cloud/*"]' package.json >/dev/null 2>&1; then
            CLOUD_PROVIDER="Google Cloud"
        elif jq -e '.dependencies["@azure/*"]' package.json >/dev/null 2>&1; then
            CLOUD_PROVIDER="Azure"
        fi
    fi
    
    # Platform-specific configs
    if [[ -f vercel.json ]]; then
        CLOUD_PROVIDER="Vercel"
        DEPLOYMENT_STRATEGY="Serverless"
    elif [[ -f netlify.toml ]]; then
        CLOUD_PROVIDER="Netlify"
        DEPLOYMENT_STRATEGY="JAMstack"
    elif [[ -f Procfile ]]; then
        CLOUD_PROVIDER="Heroku"
        DEPLOYMENT_STRATEGY="Platform-as-a-Service"
    fi
    
    # Docker detection
    if [[ -f Dockerfile ]]; then
        if [[ "$CONTAINER_ORCHESTRATION" == "none" ]]; then
            CONTAINER_ORCHESTRATION="Docker"
        fi
        DEPLOYMENT_STRATEGY="Containerized"
    fi
    
    if [[ -f docker-compose.yml ]] || [[ -f docker-compose.yaml ]]; then
        CONTAINER_ORCHESTRATION="Docker Compose"
        DEPLOYMENT_STRATEGY="Multi-container"
    fi
    
    # Environment configurations
    for env_file in .env .env.local .env.production .env.staging .env.development; do
        [[ -f "$env_file" ]] && ENV_CONFIGS+=("$env_file")
    done
    
    update_json '.enhanced_analysis.deployment_intelligence.kubernetes_config' "$KUBERNETES_CONFIG"
    update_json '.enhanced_analysis.deployment_intelligence.cloud_provider' "\"$CLOUD_PROVIDER\""
    update_json '.enhanced_analysis.deployment_intelligence.container_orchestration' "\"$CONTAINER_ORCHESTRATION\""
    update_json '.enhanced_analysis.deployment_intelligence.deployment_strategy' "\"$DEPLOYMENT_STRATEGY\""
    update_json '.enhanced_analysis.deployment_intelligence.environment_configs' "$(printf '%s\n' "${ENV_CONFIGS[@]:-}" | jq -R . | jq -s .)"
}

# ✨ Code Quality Intelligence
analyze_code_quality_intelligence() {
    echo -e "${CYAN}✨ Analyzing code quality intelligence...${NC}"
    
    local ESLINT_FOUND=false
    local PRETTIER_FOUND=false
    local TYPESCRIPT_FOUND=false
    local HUSKY_HOOKS=false
    local LINT_STAGED=false
    local QUALITY_SCORE="unknown"
    
    # ESLint detection
    if [[ -f .eslintrc.js ]] || [[ -f .eslintrc.json ]] || [[ -f .eslintrc.yml ]] || [[ -f .eslintrc.yaml ]] || [[ -f eslint.config.js ]]; then
        ESLINT_FOUND=true
    elif [[ -f package.json ]] && jq -e '.devDependencies.eslint // .dependencies.eslint' package.json >/dev/null 2>&1; then
        ESLINT_FOUND=true
    fi
    
    # Prettier detection
    if [[ -f .prettierrc ]] || [[ -f .prettierrc.json ]] || [[ -f .prettierrc.js ]] || [[ -f prettier.config.js ]]; then
        PRETTIER_FOUND=true
    elif [[ -f package.json ]] && jq -e '.devDependencies.prettier // .dependencies.prettier' package.json >/dev/null 2>&1; then
        PRETTIER_FOUND=true
    fi
    
    # TypeScript detection
    if [[ -f tsconfig.json ]] || [[ -f tsconfig.build.json ]]; then
        TYPESCRIPT_FOUND=true
    elif [[ -f package.json ]] && jq -e '.devDependencies.typescript // .dependencies.typescript' package.json >/dev/null 2>&1; then
        TYPESCRIPT_FOUND=true
    fi
    
    # Husky detection
    if [[ -d .husky ]] || [[ -f .huskyrc ]]; then
        HUSKY_HOOKS=true
    elif [[ -f package.json ]] && jq -e '.devDependencies.husky' package.json >/dev/null 2>&1; then
        HUSKY_HOOKS=true
    fi
    
    # Lint-staged detection
    if [[ -f package.json ]] && jq -e '."lint-staged" // .devDependencies."lint-staged"' package.json >/dev/null 2>&1; then
        LINT_STAGED=true
    fi
    
    # Quality score calculation
    local SCORE=0
    [[ $ESLINT_FOUND == true ]] && ((SCORE += 20))
    [[ $PRETTIER_FOUND == true ]] && ((SCORE += 20))
    [[ $TYPESCRIPT_FOUND == true ]] && ((SCORE += 25))
    [[ $HUSKY_HOOKS == true ]] && ((SCORE += 20))
    [[ $LINT_STAGED == true ]] && ((SCORE += 15))
    
    if [[ $SCORE -ge 80 ]]; then
        QUALITY_SCORE="excellent"
    elif [[ $SCORE -ge 60 ]]; then
        QUALITY_SCORE="good"
    elif [[ $SCORE -ge 40 ]]; then
        QUALITY_SCORE="fair"
    else
        QUALITY_SCORE="poor"
    fi
    
    update_json '.enhanced_analysis.code_quality_intelligence.eslint_config_found' "$ESLINT_FOUND"
    update_json '.enhanced_analysis.code_quality_intelligence.prettier_config_found' "$PRETTIER_FOUND"
    update_json '.enhanced_analysis.code_quality_intelligence.typescript_config_found' "$TYPESCRIPT_FOUND"
    update_json '.enhanced_analysis.code_quality_intelligence.husky_hooks' "$HUSKY_HOOKS"
    update_json '.enhanced_analysis.code_quality_intelligence.lint_staged' "$LINT_STAGED"
    update_json '.enhanced_analysis.code_quality_intelligence.quality_score' "\"$QUALITY_SCORE\""
}

# 🧪 Test Intelligence Analysis
analyze_test_intelligence() {
    echo -e "${CYAN}🧪 Analyzing test intelligence...${NC}"
    
    local JEST_CONFIG=false
    local COVERAGE_CONFIG=false
    local COVERAGE_THRESHOLD="unknown"
    local TEST_STRATEGY="unknown"
    local E2E_TESTS=false
    
    # Jest configuration detection
    if [[ -f jest.config.js ]] || [[ -f jest.config.ts ]] || [[ -f jest.config.json ]]; then
        JEST_CONFIG=true
    elif [[ -f package.json ]] && jq -e '.jest' package.json >/dev/null 2>&1; then
        JEST_CONFIG=true
    fi
    
    # Coverage configuration
    if [[ -f package.json ]] && jq -e '.jest.collectCoverage // .jest.coverageThreshold' package.json >/dev/null 2>&1; then
        COVERAGE_CONFIG=true
        COVERAGE_THRESHOLD=$(jq -r '.jest.coverageThreshold.global.lines // "unknown"' package.json 2>/dev/null)
    fi
    
    # Test strategy analysis
    local UNIT_TESTS=$(find . -name "*.test.*" -o -name "*.spec.*" | wc -l)
    local INTEGRATION_TESTS=$(find . -name "*.integration.*" -o -name "*.int.*" | wc -l)
    
    if [[ $UNIT_TESTS -gt 0 && $INTEGRATION_TESTS -gt 0 ]]; then
        TEST_STRATEGY="comprehensive"
    elif [[ $UNIT_TESTS -gt 5 ]]; then
        TEST_STRATEGY="unit-focused"
    elif [[ $UNIT_TESTS -gt 0 ]]; then
        TEST_STRATEGY="basic"
    else
        TEST_STRATEGY="none"
    fi
    
    # E2E tests detection
    if [[ -f package.json ]]; then
        if jq -e '.devDependencies.cypress // .devDependencies.playwright // .devDependencies["@playwright/test"]' package.json >/dev/null 2>&1; then
            E2E_TESTS=true
        fi
    fi
    
    # Check for e2e directories
    if [[ -d cypress ]] || [[ -d e2e ]] || [[ -d tests/e2e ]]; then
        E2E_TESTS=true
    fi
    
    update_json '.enhanced_analysis.test_intelligence.jest_config_found' "$JEST_CONFIG"
    update_json '.enhanced_analysis.test_intelligence.test_coverage_config' "$COVERAGE_CONFIG"
    update_json '.enhanced_analysis.test_intelligence.coverage_threshold' "\"$COVERAGE_THRESHOLD\""
    update_json '.enhanced_analysis.test_intelligence.test_strategy' "\"$TEST_STRATEGY\""
    update_json '.enhanced_analysis.test_intelligence.e2e_tests' "$E2E_TESTS"
}

# 📁 Folder Intelligence Analysis
analyze_folder_intelligence() {
    echo -e "${CYAN}📁 Analyzing folder intelligence...${NC}"
    
    local ARCHITECTURE_PATTERN="unknown"
    local MODULAR_STRUCTURE=false
    local SERVICE_LAYER=false
    local COMPONENT_ORGANIZATION="unknown"
    local FOLDER_DEPTH=0
    
    # Calculate folder depth
    FOLDER_DEPTH=$(find . -type d | awk -F/ '{print NF}' | sort -n | tail -1)
    
    # Architecture pattern detection
    if [[ -d src/components && -d src/pages ]]; then
        ARCHITECTURE_PATTERN="page-component"
    elif [[ -d src/features || -d src/modules ]]; then
        ARCHITECTURE_PATTERN="feature-based"
        MODULAR_STRUCTURE=true
    elif [[ -d src/domain && -d src/infrastructure ]]; then
        ARCHITECTURE_PATTERN="domain-driven"
        MODULAR_STRUCTURE=true
    elif [[ -d src/controllers && -d src/services && -d src/models ]]; then
        ARCHITECTURE_PATTERN="mvc"
        SERVICE_LAYER=true
    elif [[ -d api && -d components ]]; then
        ARCHITECTURE_PATTERN="api-frontend-split"
    fi
    
    # Service layer detection
    if [[ -d src/services || -d services || -d src/api/services ]]; then
        SERVICE_LAYER=true
    fi
    
    # Component organization
    if [[ -d src/components ]]; then
        local COMPONENT_SUBDIRS=$(find src/components -type d | wc -l)
        if [[ $COMPONENT_SUBDIRS -gt 10 ]]; then
            COMPONENT_ORGANIZATION="highly-organized"
        elif [[ $COMPONENT_SUBDIRS -gt 5 ]]; then
            COMPONENT_ORGANIZATION="well-organized"
        else
            COMPONENT_ORGANIZATION="basic"
        fi
    fi
    
    # Modular structure indicators
    if [[ -d src/shared ]] || [[ -d src/common ]] || [[ -d src/utils ]] || [[ -d src/lib ]]; then
        MODULAR_STRUCTURE=true
    fi
    
    update_json '.enhanced_analysis.folder_intelligence.architecture_pattern' "\"$ARCHITECTURE_PATTERN\""
    update_json '.enhanced_analysis.folder_intelligence.modular_structure' "$MODULAR_STRUCTURE"
    update_json '.enhanced_analysis.folder_intelligence.service_layer' "$SERVICE_LAYER"
    update_json '.enhanced_analysis.folder_intelligence.component_organization' "\"$COMPONENT_ORGANIZATION\""
    update_json '.enhanced_analysis.folder_intelligence.folder_depth_score' "$FOLDER_DEPTH"
}

# 💼 Business Intelligence Analysis
analyze_business_intelligence() {
    echo -e "${CYAN}💼 Analyzing business intelligence...${NC}"
    
    local DOMAIN_MODELS=()
    local BUSINESS_WORKFLOWS=()
    local API_DESIGN="unknown"
    local DATA_FLOW="unknown"
    local BUSINESS_RULES="unknown"
    
    # Domain models detection
    if [[ -d . ]]; then
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            local model=$(echo "$line" | grep -oE '(class|interface|type)\s+[A-Z][a-zA-Z]*' | awk '{print $2}')
            [[ -n "$model" ]] && DOMAIN_MODELS+=("$model")
        done < <(find . -name "*.ts" -o -name "*.js" | xargs grep -E "(class|interface|type)\s+[A-Z]" 2>/dev/null | head -10)
    fi
    
    # Business workflows detection
    if grep -r "workflow\|process\|step\|stage" . --include="*.ts" --include="*.js" >/dev/null 2>&1; then
        BUSINESS_WORKFLOWS+=("workflow-detected")
    fi
    
    if grep -r "order.*process\|payment.*flow\|checkout.*step" . --include="*.ts" --include="*.js" >/dev/null 2>&1; then
        BUSINESS_WORKFLOWS+=("e-commerce-flow")
    fi
    
    # API design pattern
    local REST_COUNT=$(grep -r "app\.\(get\|post\|put\|delete\)" . --include="*.ts" --include="*.js" 2>/dev/null | wc -l)
    local GRAPHQL_COUNT=$(grep -r "type Query\|type Mutation\|resolvers" . --include="*.ts" --include="*.js" --include="*.graphql" 2>/dev/null | wc -l)
    
    if [[ $GRAPHQL_COUNT -gt 0 ]]; then
        API_DESIGN="GraphQL"
    elif [[ $REST_COUNT -gt 0 ]]; then
        API_DESIGN="REST"
    fi
    
    # Data flow pattern
    if grep -r "redux\|zustand\|mobx" . --include="*.ts" --include="*.js" >/dev/null 2>&1; then
        DATA_FLOW="state-management"
    elif grep -r "event.*emit\|event.*listener" . --include="*.ts" --include="*.js" >/dev/null 2>&1; then
        DATA_FLOW="event-driven"
    fi
    
    # Business rules location
    if [[ -d src/business ]] || [[ -d src/domain ]]; then
        BUSINESS_RULES="domain-layer"
    elif [[ -d src/services ]]; then
        BUSINESS_RULES="service-layer"
    elif grep -r "validation\|rules\|policy" . --include="*.ts" --include="*.js" >/dev/null 2>&1; then
        BUSINESS_RULES="scattered"
    fi
    
    update_json '.enhanced_analysis.business_intelligence.domain_models' "$(printf '%s\n' "${DOMAIN_MODELS[@]:-}" | jq -R . | jq -s .)"
    update_json '.enhanced_analysis.business_intelligence.business_workflows' "$(printf '%s\n' "${BUSINESS_WORKFLOWS[@]:-}" | jq -R . | jq -s .)"
    update_json '.enhanced_analysis.business_intelligence.api_design_pattern' "\"$API_DESIGN\""
    update_json '.enhanced_analysis.business_intelligence.data_flow_pattern' "\"$DATA_FLOW\""
    update_json '.enhanced_analysis.business_intelligence.business_rules_location' "\"$BUSINESS_RULES\""
}

# 🔄 State Management Intelligence
analyze_state_management_intelligence() {
    echo -e "${CYAN}🔄 Analyzing state management intelligence...${NC}"
    
    local FRONTEND_STATE="none"
    local GLOBAL_STATE=false
    local STATE_PERSISTENCE=false
    local STATE_PATTERN="unknown"
    
    if [[ -f package.json ]]; then
        # Redux family
        if jq -e '.dependencies.redux // .dependencies["@reduxjs/toolkit"] // .dependencies["react-redux"]' package.json >/dev/null 2>&1; then
            FRONTEND_STATE="Redux"
            GLOBAL_STATE=true
            STATE_PATTERN="flux-architecture"
        fi
        
        # Zustand
        if jq -e '.dependencies.zustand' package.json >/dev/null 2>&1; then
            FRONTEND_STATE="Zustand"
            GLOBAL_STATE=true
            STATE_PATTERN="simple-global"
        fi
        
        # MobX
        if jq -e '.dependencies.mobx // .dependencies["mobx-react"]' package.json >/dev/null 2>&1; then
            FRONTEND_STATE="MobX"
            GLOBAL_STATE=true
            STATE_PATTERN="reactive"
        fi
        
        # Context API
        if grep -r "createContext\|useContext" . --include="*.tsx" --include="*.jsx" >/dev/null 2>&1; then
            if [[ "$FRONTEND_STATE" == "none" ]]; then
                FRONTEND_STATE="React Context"
                GLOBAL_STATE=true
                STATE_PATTERN="context-based"
            fi
        fi
        
        # Local state only
        if [[ "$FRONTEND_STATE" == "none" ]] && grep -r "useState\|useReducer" . --include="*.tsx" --include="*.jsx" >/dev/null 2>&1; then
            FRONTEND_STATE="Local State Only"
            STATE_PATTERN="component-local"
        fi
        
        # State persistence
        if jq -e '.dependencies["redux-persist"] // .dependencies["zustand/middleware"]' package.json >/dev/null 2>&1; then
            STATE_PERSISTENCE=true
        elif grep -r "localStorage\|sessionStorage\|persist" . --include="*.ts" --include="*.js" >/dev/null 2>&1; then
            STATE_PERSISTENCE=true
        fi
    fi
    
    update_json '.enhanced_analysis.state_management_intelligence.frontend_state_solution' "\"$FRONTEND_STATE\""
    update_json '.enhanced_analysis.state_management_intelligence.global_state_detected' "$GLOBAL_STATE"
    update_json '.enhanced_analysis.state_management_intelligence.state_persistence' "$STATE_PERSISTENCE"
    update_json '.enhanced_analysis.state_management_intelligence.state_management_pattern' "\"$STATE_PATTERN\""
}

# 🏗️ Infrastructure Intelligence
analyze_infrastructure_intelligence() {
    echo -e "${CYAN}🏗️ Analyzing infrastructure intelligence...${NC}"
    
    local IAC_TOOL="none"
    local TERRAFORM_FILES=false
    local PULUMI_FILES=false
    local CLOUDFORMATION_FILES=false
    local INFRA_PATTERN="unknown"
    
    # Terraform detection
    if [[ -f main.tf ]] || [[ -f terraform.tf ]] || find . -name "*.tf" | head -1 | read; then
        TERRAFORM_FILES=true
        IAC_TOOL="Terraform"
        INFRA_PATTERN="declarative-iac"
    fi
    
    # Pulumi detection
    if [[ -f Pulumi.yaml ]] || [[ -f Pulumi.yml ]]; then
        PULUMI_FILES=true
        IAC_TOOL="Pulumi"
        INFRA_PATTERN="programmatic-iac"
    fi
    
    # CloudFormation detection
    if find . -name "*.template" -o -name "cloudformation.yml" -o -name "cloudformation.yaml" | head -1 | read; then
        CLOUDFORMATION_FILES=true
        IAC_TOOL="CloudFormation"
        INFRA_PATTERN="aws-native-iac"
    fi
    
    # CDK detection
    if [[ -f package.json ]] && jq -e '.dependencies["aws-cdk-lib"] // .dependencies["@aws-cdk/*"]' package.json >/dev/null 2>&1; then
        IAC_TOOL="AWS CDK"
        INFRA_PATTERN="programmatic-iac"
    fi
    
    # Docker-based infrastructure
    if [[ -f docker-compose.yml ]] && [[ "$IAC_TOOL" == "none" ]]; then
        IAC_TOOL="Docker Compose"
        INFRA_PATTERN="container-orchestration"
    fi
    
    update_json '.enhanced_analysis.infrastructure_intelligence.iac_tool' "\"$IAC_TOOL\""
    update_json '.enhanced_analysis.infrastructure_intelligence.terraform_files' "$TERRAFORM_FILES"
    update_json '.enhanced_analysis.infrastructure_intelligence.pulumi_files' "$PULUMI_FILES"
    update_json '.enhanced_analysis.infrastructure_intelligence.cloudformation_files' "$CLOUDFORMATION_FILES"
    update_json '.enhanced_analysis.infrastructure_intelligence.infrastructure_pattern' "\"$INFRA_PATTERN\""
}

# 🚀 CI/CD Intelligence
analyze_cicd_intelligence() {
    echo -e "${CYAN}🚀 Analyzing CI/CD intelligence...${NC}"
    
    local PIPELINE_PROVIDER="none"
    local WORKFLOW_FILES=()
    local DEPLOYMENT_AUTOMATION=false
    local TESTING_AUTOMATION=false
    local SECURITY_SCANNING=false
    
    # GitHub Actions
    if [[ -d .github/workflows ]]; then
        PIPELINE_PROVIDER="GitHub Actions"
        while IFS= read -r file; do
            [[ -n "$file" ]] && WORKFLOW_FILES+=("$(basename "$file")")
        done < <(find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null)
        
        # Check workflow content
        if grep -r "deploy\|deployment" .github/workflows/ >/dev/null 2>&1; then
            DEPLOYMENT_AUTOMATION=true
        fi
        
        if grep -r "test\|jest\|npm.*test" .github/workflows/ >/dev/null 2>&1; then
            TESTING_AUTOMATION=true
        fi
        
        if grep -r "security\|audit\|snyk\|codeql" .github/workflows/ >/dev/null 2>&1; then
            SECURITY_SCANNING=true
        fi
    fi
    
    # GitLab CI
    if [[ -f .gitlab-ci.yml ]]; then
        PIPELINE_PROVIDER="GitLab CI"
        WORKFLOW_FILES+=(".gitlab-ci.yml")
        
        if grep -q "deploy:" .gitlab-ci.yml; then
            DEPLOYMENT_AUTOMATION=true
        fi
        
        if grep -q "test:" .gitlab-ci.yml; then
            TESTING_AUTOMATION=true
        fi
    fi
    
    # Jenkins
    if [[ -f Jenkinsfile ]] || [[ -f jenkins.yml ]]; then
        PIPELINE_PROVIDER="Jenkins"
        WORKFLOW_FILES+=("Jenkinsfile")
    fi
    
    # CircleCI
    if [[ -f .circleci/config.yml ]]; then
        PIPELINE_PROVIDER="CircleCI"
        WORKFLOW_FILES+=("config.yml")
    fi
    
    # Travis CI
    if [[ -f .travis.yml ]]; then
        PIPELINE_PROVIDER="Travis CI"
        WORKFLOW_FILES+=(".travis.yml")
    fi
    
    update_json '.enhanced_analysis.cicd_intelligence.pipeline_provider' "\"$PIPELINE_PROVIDER\""
    update_json '.enhanced_analysis.cicd_intelligence.workflow_files' "$(printf '%s\n' "${WORKFLOW_FILES[@]:-}" | jq -R . | jq -s .)"
    update_json '.enhanced_analysis.cicd_intelligence.deployment_automation' "$DEPLOYMENT_AUTOMATION"
    update_json '.enhanced_analysis.cicd_intelligence.testing_automation' "$TESTING_AUTOMATION"
    update_json '.enhanced_analysis.cicd_intelligence.security_scanning' "$SECURITY_SCANNING"
}

# Enhanced analysis runner
run_enhanced_analysis() {
    echo -e "${BOLD}${PURPLE}🧠 Running Enhanced Intelligence Analysis...${NC}"
    
    analyze_readme_intelligence
    analyze_deployment_intelligence
    analyze_code_quality_intelligence
    analyze_test_intelligence
    analyze_folder_intelligence
    analyze_business_intelligence
    analyze_state_management_intelligence
    analyze_infrastructure_intelligence
    analyze_cicd_intelligence
}

# === END ENHANCED INTELLIGENCE MODULES ===#!/bin/bash
# pread v5.0 - AI-Ready Project Analyzer
# Comprehensive project analysis for AI consumption

set -euo pipefail

VERSION="5.0"
START_TIME=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Global JSON object
JSON_OUTPUT='{}'

# Helper function to update JSON
update_json() {
    local key="$1"
    local value="$2"
    JSON_OUTPUT=$(echo "$JSON_OUTPUT" | jq "$key = $value")
}

# Helper function to add to array
add_to_array() {
    local key="$1"
    local value="$2"
    JSON_OUTPUT=$(echo "$JSON_OUTPUT" | jq "$key += [$value]")
}

echo -e "${BLUE}🚀 AI-Ready Project Analyzer v$VERSION${NC}"
echo -e "${YELLOW}📊 Deep analyzing project for AI consumption...${NC}"

# Initialize JSON structure
initialize_json() {
    JSON_OUTPUT=$(jq -n '{
        metadata: {
            analyzer_version: "'$VERSION'",
            timestamp: "'$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")'",
            project_path: "'$(pwd)'",
            analysis_duration_seconds: 0
        },
        project_identification: {
            name: null,
            description: null,
            version: null,
            main_language: null,
            framework: null,
            project_type: null,
            business_domain: null,
            target_platform: null
        },
        codebase_structure: {
            total_files: 0,
            code_files: 0,
            total_lines_of_code: 0,
            languages: {},
            main_directories: [],
            entry_points: [],
            config_files: [],
            documentation_files: []
        },
        technology_stack: {
            runtime: null,
            framework: null,
            frontend_technologies: [],
            backend_technologies: [],
            databases: [],
            caching: [],
            message_queues: [],
            testing_frameworks: [],
            build_tools: [],
            deployment_tools: [],
            monitoring_tools: [],
            external_services: []
        },
        dependencies: {
            package_managers: [],
            production_dependencies: {},
            development_dependencies: {},
            total_dependency_count: 0,
            security_vulnerabilities: [],
            outdated_packages: [],
            license_types: []
        },
        api_architecture: {
            api_type: null,
            rest_endpoints: [],
            graphql_schemas: [],
            websocket_events: [],
            middleware: [],
            authentication_methods: [],
            rate_limiting: false,
            cors_configuration: {},
            api_versioning: null
        },
        database_architecture: {
            database_type: null,
            orm_framework: null,
            migration_system: null,
            models: [],
            relationships: [],
            indexing_strategy: null,
            connection_pooling: false,
            backup_strategy: null
        },
        business_logic: {
            core_features: [],
            user_roles: [],
            business_entities: [],
            workflows: [],
            business_rules: [],
            integration_points: [],
            payment_processing: false,
            notification_system: false,
            file_management: false
        },
        security_analysis: {
            authentication_strategy: null,
            authorization_model: null,
            encryption_usage: [],
            security_headers: [],
            input_validation: false,
            sql_injection_protection: false,
            xss_protection: false,
            csrf_protection: false,
            rate_limiting: false,
            security_testing: false
        },
        deployment_infrastructure: {
            containerization: null,
            orchestration: null,
            cloud_provider: null,
            ci_cd_pipeline: null,
            environment_management: [],
            scaling_strategy: null,
            monitoring_setup: null,
            logging_strategy: null,
            backup_strategy: null
        },
        code_quality: {
            linting_setup: null,
            formatting_setup: null,
            type_checking: null,
            test_coverage: null,
            testing_strategy: [],
            code_complexity: null,
            documentation_coverage: null,
            commit_conventions: null
        },
        performance_characteristics: {
            estimated_bundle_size: null,
            loading_strategy: null,
            caching_strategy: [],
            optimization_techniques: [],
            performance_monitoring: false,
            cdn_usage: false,
            compression_enabled: false
        },
        ai_insights: {
            project_purpose: null,
            complexity_level: null,
            development_stage: null,
            team_size_estimate: null,
            maintenance_effort: null,
            scalability_potential: null,
            business_value: null,
            technical_debt_level: null,
            innovation_score: null,
            recommended_improvements: []
        },
        advanced_metrics: {
            code_duplication_score: null,
            outdated_dependency_count: 0,
            test_coverage_percentage: null,
            console_logs_count: 0,
            structured_logs_count: 0,
            import_statements_count: 0,
            export_statements_count: 0,
            cyclomatic_complexity_level: null,
            module_coupling_score: null,
            dead_code_detected: false,
            performance_bottlenecks: [],
            security_hotspots: []
        },
        enhanced_analysis: {
            readme_intelligence: {
                content_quality: null,
                project_purpose_clarity: null,
                setup_instructions: false,
                api_documentation: false,
                contributing_guidelines: false
            },
            deployment_intelligence: {
                kubernetes_config: false,
                cloud_provider: null,
                container_orchestration: null,
                deployment_strategy: null,
                environment_configs: []
            },
            code_quality_intelligence: {
                eslint_config_found: false,
                prettier_config_found: false,
                typescript_config_found: false,
                husky_hooks: false,
                lint_staged: false,
                quality_score: null
            },
            test_intelligence: {
                jest_config_found: false,
                test_coverage_config: false,
                coverage_threshold: null,
                test_strategy: null,
                e2e_tests: false
            },
            folder_intelligence: {
                architecture_pattern: null,
                modular_structure: false,
                service_layer: false,
                component_organization: null,
                folder_depth_score: null
            },
            business_intelligence: {
                domain_models: [],
                business_workflows: [],
                api_design_pattern: null,
                data_flow_pattern: null,
                business_rules_location: null
            },
            state_management_intelligence: {
                frontend_state_solution: null,
                global_state_detected: false,
                state_persistence: false,
                state_management_pattern: null
            },
            infrastructure_intelligence: {
                iac_tool: null,
                terraform_files: false,
                pulumi_files: false,
                cloudformation_files: false,
                infrastructure_pattern: null
            },
            cicd_intelligence: {
                pipeline_provider: null,
                workflow_files: [],
                deployment_automation: false,
                testing_automation: false,
                security_scanning: false
            }
        },
        extracted_code_samples: {
            main_functions: [],
            api_endpoints: [],
            database_queries: [],
            configuration_snippets: [],
            test_examples: []
        },
        file_contents: {
            package_json: null,
            readme_content: null,
            env_example: null,
            docker_config: null,
            ci_config: null,
            main_entry_file: null
        }
    }')
}

# 1. Project Identification
analyze_project_identification() {
    echo -e "${CYAN}🔍 Analyzing project identification...${NC}"
    
    local PROJECT_NAME=""
    local DESCRIPTION=""
    local VERSION=""
    local MAIN_LANGUAGE=""
    local FRAMEWORK=""
    local PROJECT_TYPE=""
    local BUSINESS_DOMAIN=""
    
    # Package.json analysis
    if [[ -f package.json ]]; then
        PROJECT_NAME=$(jq -r '.name // ""' package.json)
        DESCRIPTION=$(jq -r '.description // ""' package.json)
        VERSION=$(jq -r '.version // ""' package.json)
        MAIN_LANGUAGE="JavaScript"
        
        # Framework detection
        if jq -e '.dependencies.express' package.json >/dev/null 2>&1; then
            FRAMEWORK="Express.js"
            PROJECT_TYPE="Backend API"
        elif jq -e '.dependencies.fastify' package.json >/dev/null 2>&1; then
            FRAMEWORK="Fastify"
            PROJECT_TYPE="Backend API"
        elif jq -e '.dependencies.next' package.json >/dev/null 2>&1; then
            FRAMEWORK="Next.js"
            PROJECT_TYPE="Full-stack Web Application"
        elif jq -e '.dependencies.react' package.json >/dev/null 2>&1; then
            FRAMEWORK="React"
            PROJECT_TYPE="Frontend Application"
        elif jq -e '.dependencies.vue' package.json >/dev/null 2>&1; then
            FRAMEWORK="Vue.js"
            PROJECT_TYPE="Frontend Application"
        fi
        
        # Business domain detection
        local PKG_CONTENT=$(cat package.json | tr '[:upper:]' '[:lower:]')
        if echo "$PKG_CONTENT" | grep -q "ecommerce\|shop\|cart\|payment\|order"; then
            BUSINESS_DOMAIN="E-commerce"
        elif echo "$PKG_CONTENT" | grep -q "blog\|cms\|content"; then
            BUSINESS_DOMAIN="Content Management"
        elif echo "$PKG_CONTENT" | grep -q "auth\|login\|identity"; then
            BUSINESS_DOMAIN="Authentication"
        elif echo "$PKG_CONTENT" | grep -q "api\|service\|microservice"; then
            BUSINESS_DOMAIN="API Services"
        elif echo "$PKG_CONTENT" | grep -q "dashboard\|admin\|panel"; then
            BUSINESS_DOMAIN="Admin/Dashboard"
        elif echo "$PKG_CONTENT" | grep -q "chat\|message\|social"; then
            BUSINESS_DOMAIN="Communication"
        fi
    fi
    
    # Python projects
    if [[ -f requirements.txt ]] || [[ -f pyproject.toml ]]; then
        MAIN_LANGUAGE="Python"
        if [[ -f manage.py ]]; then
            FRAMEWORK="Django"
            PROJECT_TYPE="Web Application"
        elif grep -q "flask" requirements.txt 2>/dev/null; then
            FRAMEWORK="Flask"
            PROJECT_TYPE="Web Application"
        elif grep -q "fastapi" requirements.txt 2>/dev/null; then
            FRAMEWORK="FastAPI"
            PROJECT_TYPE="API Service"
        fi
    fi
    
    # Go projects
    if [[ -f go.mod ]]; then
        MAIN_LANGUAGE="Go"
        PROJECT_NAME=$(grep "^module" go.mod | awk '{print $2}' | xargs basename)
    fi
    
    # README analysis for project name and description
    if [[ -f README.md ]]; then
        local README_FIRST_LINE=$(head -1 README.md | sed 's/^#*\s*//')
        [[ -z "$PROJECT_NAME" ]] && PROJECT_NAME="$README_FIRST_LINE"
        
        # Extract description from README
        if [[ -z "$DESCRIPTION" ]]; then
            DESCRIPTION=$(head -10 README.md | grep -v "^#" | grep -v "^$" | head -1)
        fi
    fi
    
    # Fallback to directory name
    [[ -z "$PROJECT_NAME" ]] && PROJECT_NAME=$(basename "$(pwd)")
    
    update_json '.project_identification.name' "\"$PROJECT_NAME\""
    update_json '.project_identification.description' "\"$DESCRIPTION\""
    update_json '.project_identification.version' "\"$VERSION\""
    update_json '.project_identification.main_language' "\"$MAIN_LANGUAGE\""
    update_json '.project_identification.framework' "\"$FRAMEWORK\""
    update_json '.project_identification.project_type' "\"$PROJECT_TYPE\""
    update_json '.project_identification.business_domain' "\"$BUSINESS_DOMAIN\""
}

# 2. Codebase Structure Analysis
analyze_codebase_structure() {
    echo -e "${CYAN}📁 Analyzing codebase structure...${NC}"
    
    # Count files and lines
    local TOTAL_FILES=$(find . -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" | wc -l)
    local CODE_FILES=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.php" -o -name "*.rb" \) ! -path "*/node_modules/*" ! -path "*/.git/*" | wc -l)
    
    # Count lines of code
    local TOTAL_LOC=0
    if command -v wc >/dev/null 2>&1; then
        TOTAL_LOC=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) ! -path "*/node_modules/*" ! -path "*/.git/*" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo 0)
    fi
    
    # Language distribution
    local LANGUAGES='{}'
    for ext in js ts jsx tsx py go rs java php rb; do
        local count=$(find . -name "*.$ext" ! -path "*/node_modules/*" ! -path "*/.git/*" | wc -l)
        if [[ $count -gt 0 ]]; then
            LANGUAGES=$(echo "$LANGUAGES" | jq ".$ext = $count")
        fi
    done
    
    # Main directories (excluding common ignorable ones)
    local MAIN_DIRS=$(find . -maxdepth 2 -type d ! -name "." ! -name ".git" ! -name "node_modules" ! -name "dist" ! -name "build" ! -name ".next" 2>/dev/null | head -20 | jq -R . | jq -s .)
    
    # Entry points
    local ENTRY_POINTS=()
    [[ -f index.js ]] && ENTRY_POINTS+=("index.js")
    [[ -f index.ts ]] && ENTRY_POINTS+=("index.ts")
    [[ -f main.js ]] && ENTRY_POINTS+=("main.js")
    [[ -f main.ts ]] && ENTRY_POINTS+=("main.ts")
    [[ -f app.js ]] && ENTRY_POINTS+=("app.js")
    [[ -f app.ts ]] && ENTRY_POINTS+=("app.ts")
    [[ -f server.js ]] && ENTRY_POINTS+=("server.js")
    [[ -f server.ts ]] && ENTRY_POINTS+=("server.ts")
    [[ -f main.py ]] && ENTRY_POINTS+=("main.py")
    [[ -f app.py ]] && ENTRY_POINTS+=("app.py")
    [[ -f main.go ]] && ENTRY_POINTS+=("main.go")
    
    # Config files
    local CONFIG_FILES=()
    for file in package.json package-lock.json yarn.lock pnpm-lock.yaml requirements.txt pyproject.toml go.mod go.sum Cargo.toml composer.json Gemfile; do
        [[ -f "$file" ]] && CONFIG_FILES+=("$file")
    done
    
    # Documentation files
    local DOC_FILES=()
    for file in README.md CHANGELOG.md CONTRIBUTING.md LICENSE SECURITY.md docs/README.md; do
        [[ -f "$file" ]] && DOC_FILES+=("$file")
    done
    
    update_json '.codebase_structure.total_files' "$TOTAL_FILES"
    update_json '.codebase_structure.code_files' "$CODE_FILES"
    update_json '.codebase_structure.total_lines_of_code' "$TOTAL_LOC"
    update_json '.codebase_structure.languages' "$LANGUAGES"
    update_json '.codebase_structure.main_directories' "$MAIN_DIRS"
    update_json '.codebase_structure.entry_points' "$(printf '%s\n' "${ENTRY_POINTS[@]:-}" | jq -R . | jq -s .)"
    update_json '.codebase_structure.config_files' "$(printf '%s\n' "${CONFIG_FILES[@]:-}" | jq -R . | jq -s .)"
    update_json '.codebase_structure.documentation_files' "$(printf '%s\n' "${DOC_FILES[@]:-}" | jq -R . | jq -s .)"
}

# 3. Technology Stack Analysis
analyze_technology_stack() {
    echo -e "${CYAN}🛠️ Analyzing technology stack...${NC}"
    
    local RUNTIME=""
    local FRAMEWORK=""
    local FRONTEND_TECH=()
    local BACKEND_TECH=()
    local DATABASES=()
    local CACHING=()
    local MESSAGE_QUEUES=()
    local TESTING=()
    local BUILD_TOOLS=()
    local DEPLOYMENT=()
    local MONITORING=()
    local EXTERNAL=()
    
    if [[ -f package.json ]]; then
        RUNTIME="Node.js"
        
        # Extract all dependencies for analysis
        local ALL_DEPS=$(jq -r '(.dependencies // {}) * (.devDependencies // {}) | keys[]' package.json 2>/dev/null || echo "")
        
        while IFS= read -r dep; do
            [[ -z "$dep" ]] && continue
            
            case "$dep" in
                # Frontend frameworks
                "react"|"@types/react") FRONTEND_TECH+=("React") ;;
                "vue"|"@vue/cli") FRONTEND_TECH+=("Vue.js") ;;
                "angular"|"@angular/core") FRONTEND_TECH+=("Angular") ;;
                "svelte") FRONTEND_TECH+=("Svelte") ;;
                "next") FRAMEWORK="Next.js"; FRONTEND_TECH+=("Next.js") ;;
                "nuxt") FRAMEWORK="Nuxt.js"; FRONTEND_TECH+=("Nuxt.js") ;;
                
                # CSS frameworks
                "tailwindcss") FRONTEND_TECH+=("Tailwind CSS") ;;
                "bootstrap") FRONTEND_TECH+=("Bootstrap") ;;
                "sass"|"node-sass") FRONTEND_TECH+=("Sass") ;;
                
                # Backend frameworks
                "express") FRAMEWORK="Express.js"; BACKEND_TECH+=("Express.js") ;;
                "fastify") FRAMEWORK="Fastify"; BACKEND_TECH+=("Fastify") ;;
                "koa") FRAMEWORK="Koa.js"; BACKEND_TECH+=("Koa.js") ;;
                "hapi") FRAMEWORK="Hapi.js"; BACKEND_TECH+=("Hapi.js") ;;
                
                # Databases
                "mongoose") DATABASES+=("MongoDB") ;;
                "pg"|"postgresql") DATABASES+=("PostgreSQL") ;;
                "mysql"|"mysql2") DATABASES+=("MySQL") ;;
                "sqlite3") DATABASES+=("SQLite") ;;
                "redis") DATABASES+=("Redis"); CACHING+=("Redis") ;;
                
                # ORMs
                "prisma") BACKEND_TECH+=("Prisma") ;;
                "typeorm") BACKEND_TECH+=("TypeORM") ;;
                "sequelize") BACKEND_TECH+=("Sequelize") ;;
                "drizzle-orm") BACKEND_TECH+=("Drizzle ORM") ;;
                
                # Message queues
                "bull"|"bullmq") MESSAGE_QUEUES+=("Bull Queue") ;;
                "amqplib") MESSAGE_QUEUES+=("RabbitMQ") ;;
                "kafkajs") MESSAGE_QUEUES+=("Apache Kafka") ;;
                
                # Testing
                "jest") TESTING+=("Jest") ;;
                "mocha") TESTING+=("Mocha") ;;
                "cypress") TESTING+=("Cypress") ;;
                "playwright") TESTING+=("Playwright") ;;
                "vitest") TESTING+=("Vitest") ;;
                
                # Build tools
                "webpack") BUILD_TOOLS+=("Webpack") ;;
                "vite") BUILD_TOOLS+=("Vite") ;;
                "rollup") BUILD_TOOLS+=("Rollup") ;;
                "parcel") BUILD_TOOLS+=("Parcel") ;;
                "esbuild") BUILD_TOOLS+=("ESBuild") ;;
                
                # External services
                "stripe") EXTERNAL+=("Stripe Payment") ;;
                "aws-sdk") EXTERNAL+=("AWS Services") ;;
                "@google-cloud/*") EXTERNAL+=("Google Cloud") ;;
                "nodemailer") EXTERNAL+=("Email Service") ;;
                "socket.io") EXTERNAL+=("WebSocket") ;;
                "passport") BACKEND_TECH+=("Passport.js") ;;
            esac
        done <<< "$ALL_DEPS"
    fi
    
    # Python stack
    if [[ -f requirements.txt ]]; then
        RUNTIME="Python"
        
        while IFS= read -r line; do
            [[ -z "$line" || "$line" =~ ^# ]] && continue
            local package=$(echo "$line" | cut -d'=' -f1 | cut -d'>' -f1 | cut -d'<' -f1)
            
            case "$package" in
                "django") FRAMEWORK="Django"; BACKEND_TECH+=("Django") ;;
                "flask") FRAMEWORK="Flask"; BACKEND_TECH+=("Flask") ;;
                "fastapi") FRAMEWORK="FastAPI"; BACKEND_TECH+=("FastAPI") ;;
                "sqlalchemy") BACKEND_TECH+=("SQLAlchemy") ;;
                "pytest") TESTING+=("pytest") ;;
                "redis") CACHING+=("Redis") ;;
                "celery") MESSAGE_QUEUES+=("Celery") ;;
            esac
        done < requirements.txt
    fi
    
    # Go stack
    if [[ -f go.mod ]]; then
        RUNTIME="Go"
        
        if grep -q "gin-gonic/gin" go.mod; then
            FRAMEWORK="Gin"
            BACKEND_TECH+=("Gin")
        elif grep -q "gorilla/mux" go.mod; then
            BACKEND_TECH+=("Gorilla Mux")
        elif grep -q "echo" go.mod; then
            FRAMEWORK="Echo"
            BACKEND_TECH+=("Echo")
        fi
    fi
    
    # Remove duplicates
    FRONTEND_TECH=($(printf '%s\n' "${FRONTEND_TECH[@]}" | sort -u))
    BACKEND_TECH=($(printf '%s\n' "${BACKEND_TECH[@]}" | sort -u))
    DATABASES=($(printf '%s\n' "${DATABASES[@]}" | sort -u))
    CACHING=($(printf '%s\n' "${CACHING[@]}" | sort -u))
    MESSAGE_QUEUES=($(printf '%s\n' "${MESSAGE_QUEUES[@]}" | sort -u))
    TESTING=($(printf '%s\n' "${TESTING[@]}" | sort -u))
    BUILD_TOOLS=($(printf '%s\n' "${BUILD_TOOLS[@]}" | sort -u))
    EXTERNAL=($(printf '%s\n' "${EXTERNAL[@]}" | sort -u))
    
    update_json '.technology_stack.runtime' "\"$RUNTIME\""
    update_json '.technology_stack.framework' "\"$FRAMEWORK\""
    update_json '.technology_stack.frontend_technologies' "$(printf '%s\n' "${FRONTEND_TECH[@]:-}" | jq -R . | jq -s .)"
    update_json '.technology_stack.backend_technologies' "$(printf '%s\n' "${BACKEND_TECH[@]:-}" | jq -R . | jq -s .)"
    update_json '.technology_stack.databases' "$(printf '%s\n' "${DATABASES[@]:-}" | jq -R . | jq -s .)"
    update_json '.technology_stack.caching' "$(printf '%s\n' "${CACHING[@]:-}" | jq -R . | jq -s .)"
    update_json '.technology_stack.message_queues' "$(printf '%s\n' "${MESSAGE_QUEUES[@]:-}" | jq -R . | jq -s .)"
    update_json '.technology_stack.testing_frameworks' "$(printf '%s\n' "${TESTING[@]:-}" | jq -R . | jq -s .)"
    update_json '.technology_stack.build_tools' "$(printf '%s\n' "${BUILD_TOOLS[@]:-}" | jq -R . | jq -s .)"
    update_json '.technology_stack.external_services' "$(printf '%s\n' "${EXTERNAL[@]:-}" | jq -R . | jq -s .)"
}

# 4. API Architecture Analysis
analyze_api_architecture() {
    echo -e "${CYAN}📡 Analyzing API architecture...${NC}"
    
    local API_TYPE=""
    local REST_ENDPOINTS=()
    local GRAPHQL_SCHEMAS=()
    local WEBSOCKET_EVENTS=()
    local MIDDLEWARE=()
    local AUTH_METHODS=()
    local RATE_LIMITING=false
    local CORS_CONFIG='{}'
    local API_VERSIONING=""
    
    # Search for API endpoints in code files
    if [[ -d . ]]; then
        # REST endpoints
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            local endpoint=$(echo "$line" | grep -oE '(get|post|put|delete|patch)\s*\(\s*['\''"][^'\''"]+'  | sed "s/.*['\''\"]//" | sed "s/['\''\"]//" || echo "")
            [[ -n "$endpoint" ]] && REST_ENDPOINTS+=("$endpoint")
        done < <(grep -r -h "\.get\|\.post\|\.put\|\.delete\|\.patch" . --include="*.js" --include="*.ts" --include="*.py" --include="*.go" 2>/dev/null | head -50)
        
        # API type detection
        if [[ ${#REST_ENDPOINTS[@]} -gt 0 ]]; then
            API_TYPE="REST"
        fi
        
        # GraphQL detection
        if grep -r "graphql\|type Query\|type Mutation" . --include="*.js" --include="*.ts" --include="*.graphql" --include="*.gql" >/dev/null 2>&1; then
            API_TYPE="GraphQL"
            GRAPHQL_SCHEMAS+=("schema.graphql")
        fi
        
        # WebSocket detection
        if grep -r "socket\.io\|ws\|websocket" . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            WEBSOCKET_EVENTS+=("connection")
            WEBSOCKET_EVENTS+=("message")
        fi
        
        # Middleware detection
        if grep -r "cors\|helmet\|morgan\|compression" . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            grep -r "cors" . --include="*.js" --include="*.ts" >/dev/null 2>&1 && MIDDLEWARE+=("CORS")
            grep -r "helmet" . --include="*.js" --include="*.ts" >/dev/null 2>&1 && MIDDLEWARE+=("Helmet")
            grep -r "morgan" . --include="*.js" --include="*.ts" >/dev/null 2>&1 && MIDDLEWARE+=("Morgan")
            grep -r "compression" . --include="*.js" --include="*.ts" >/dev/null 2>&1 && MIDDLEWARE+=("Compression")
        fi
        
        # Authentication methods
        if grep -r "jwt\|jsonwebtoken" . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            AUTH_METHODS+=("JWT")
        fi
        if grep -r "passport" . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            AUTH_METHODS+=("Passport")
        fi
        if grep -r "oauth\|auth0" . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            AUTH_METHODS+=("OAuth")
        fi
        
        # Rate limiting
        if grep -r "express-rate-limit\|rate.limit" . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            RATE_LIMITING=true
        fi
        
        # API versioning
        if grep -r "/v[0-9]\|/api/v[0-9]" . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            API_VERSIONING="URL versioning"
        elif grep -r "Accept-Version\|API-Version" . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            API_VERSIONING="Header versioning"
        fi
    fi
    
    # Remove duplicates
    REST_ENDPOINTS=($(printf '%s\n' "${REST_ENDPOINTS[@]}" | sort -u | head -20))
    MIDDLEWARE=($(printf '%s\n' "${MIDDLEWARE[@]}" | sort -u))
    AUTH_METHODS=($(printf '%s\n' "${AUTH_METHODS[@]}" | sort -u))
    
    update_json '.api_architecture.api_type' "\"$API_TYPE\""
    update_json '.api_architecture.rest_endpoints' "$(printf '%s\n' "${REST_ENDPOINTS[@]:-}" | jq -R . | jq -s .)"
    update_json '.api_architecture.graphql_schemas' "$(printf '%s\n' "${GRAPHQL_SCHEMAS[@]:-}" | jq -R . | jq -s .)"
    update_json '.api_architecture.websocket_events' "$(printf '%s\n' "${WEBSOCKET_EVENTS[@]:-}" | jq -R . | jq -s .)"
    update_json '.api_architecture.middleware' "$(printf '%s\n' "${MIDDLEWARE[@]:-}" | jq -R . | jq -s .)"
    update_json '.api_architecture.authentication_methods' "$(printf '%s\n' "${AUTH_METHODS[@]:-}" | jq -R . | jq -s .)"
    update_json '.api_architecture.rate_limiting' "$RATE_LIMITING"
    update_json '.api_architecture.api_versioning' "\"$API_VERSIONING\""
}

# 5. Business Logic Analysis
analyze_business_logic() {
    echo -e "${CYAN}💼 Analyzing business logic...${NC}"
    
    local CORE_FEATURES=()
    local USER_ROLES=()
    local BUSINESS_ENTITIES=()
    local WORKFLOWS=()
    local BUSINESS_RULES=()
    local INTEGRATION_POINTS=()
    local PAYMENT_PROCESSING=false
    local NOTIFICATION_SYSTEM=false
    local FILE_MANAGEMENT=false
    
    # Feature detection from code patterns
    if [[ -d . ]]; then
        # Authentication features
        if grep -r "login\|register\|signup\|signin" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("User Authentication")
        fi
        
        # User management
        if grep -r "user.*create\|user.*update\|user.*delete" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("User Management")
        fi
        
        # Product/Content management
        if grep -r "product\|item\|catalog" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("Product Management")
        fi
        
        # Order management
        if grep -r "order\|cart\|checkout" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("Order Management")
        fi
        
        # Payment processing
        if grep -r "stripe\|paypal\|payment\|billing" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("Payment Processing")
            PAYMENT_PROCESSING=true
        fi
        
        # Admin features
        if grep -r "admin\|dashboard\|panel" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("Admin Panel")
        fi
        
        # Notification system
        if grep -r "notification\|email\|sms\|push" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("Notification System")
            NOTIFICATION_SYSTEM=true
        fi
        
        # File management
        if grep -r "upload\|file\|storage\|s3\|multer" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("File Management")
            FILE_MANAGEMENT=true
        fi
        
        # Search functionality
        if grep -r "search\|elasticsearch\|solr" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            CORE_FEATURES+=("Search Engine")
        fi
        
        # User roles detection
        if grep -r "role\|permission\|admin\|user\|moderator" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1; then
            USER_ROLES+=("admin")
            USER_ROLES+=("user")
            grep -r "moderator" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1 && USER_ROLES+=("moderator")
            grep -r "vendor\|seller" . --include="*.js" --include="*.ts" --include="*.py" >/dev/null 2>&1 && USER_ROLES+=("vendor")
        fi
        
        # Business entities from models/schemas
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            local entity=$(echo "$line" | grep -oE '(class|const|interface)\s+[A-Z][a-zA-Z]*' | awk '{print $2}' | grep -E '^[A-Z]' || echo "")
            [[ -n "$entity" ]] && BUSINESS_ENTITIES+=("$entity")
        done < <(grep -r "class\|const.*Schema\|interface" . --include="*.js" --include="*.ts" --include="*.py" 2>/dev/null | head -20)
        
        # Integration points
        if grep -r "process\.env\." . --include="*.js" --include="*.ts" >/dev/null 2>&1; then
            while IFS= read -r env_var; do
                case "$env_var" in
                    *API_KEY*|*SECRET*) INTEGRATION_POINTS+=("External API") ;;
                    *DATABASE*|*DB_*) INTEGRATION_POINTS+=("Database") ;;
                    *REDIS*|*CACHE*) INTEGRATION_POINTS+=("Cache Service") ;;
                    *EMAIL*|*MAIL*) INTEGRATION_POINTS+=("Email Service") ;;
                    *AWS*|*S3*) INTEGRATION_POINTS+=("AWS Services") ;;
                esac
            done < <(grep -r "process\.env\." . --include="*.js" --include="*.ts" 2>/dev/null | grep -oE 'process\.env\.[A-Z_]+' | sort -u | head -10)
        fi
    fi
    
    # Remove duplicates
    CORE_FEATURES=($(printf '%s\n' "${CORE_FEATURES[@]}" | sort -u))
    USER_ROLES=($(printf '%s\n' "${USER_ROLES[@]}" | sort -u))
    BUSINESS_ENTITIES=($(printf '%s\n' "${BUSINESS_ENTITIES[@]}" | sort -u | head -10))
    INTEGRATION_POINTS=($(printf '%s\n' "${INTEGRATION_POINTS[@]}" | sort -u))
    
    update_json '.business_logic.core_features' "$(printf '%s\n' "${CORE_FEATURES[@]:-}" | jq -R . | jq -s .)"
    update_json '.business_logic.user_roles' "$(printf '%s\n' "${USER_ROLES[@]:-}" | jq -R . | jq -s .)"
    update_json '.business_logic.business_entities' "$(printf '%s\n' "${BUSINESS_ENTITIES[@]:-}" | jq -R . | jq -s .)"
    update_json '.business_logic.integration_points' "$(printf '%s\n' "${INTEGRATION_POINTS[@]:-}" | jq -R . | jq -s .)"
    update_json '.business_logic.payment_processing' "$PAYMENT_PROCESSING"
    update_json '.business_logic.notification_system' "$NOTIFICATION_SYSTEM"
    update_json '.business_logic.file_management' "$FILE_MANAGEMENT"
}

# 6. Extract Code Samples
extract_code_samples() {
    echo -e "${CYAN}🔍 Extracting code samples...${NC}"
    
    local MAIN_FUNCTIONS=()
    local API_ENDPOINTS=()
    local DATABASE_QUERIES=()
    local CONFIG_SNIPPETS=()
    local TEST_EXAMPLES=()
    
    # Extract main functions
    if [[ -d . ]]; then
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            MAIN_FUNCTIONS+=("$line")
        done < <(grep -r "function\|const.*=.*=>\|def\|func" . --include="*.js" --include="*.ts" --include="*.py" --include="*.go" 2>/dev/null | grep -E "(main|init|start|create|update|delete|get)" | head -10 | cut -d: -f2- | sed 's/^[[:space:]]*//')
        
        # Extract API endpoint examples
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            API_ENDPOINTS+=("$line")
        done < <(grep -r "app\.\(get\|post\|put\|delete\)\|router\.\(get\|post\|put\|delete\)" . --include="*.js" --include="*.ts" 2>/dev/null | head -5 | cut -d: -f2- | sed 's/^[[:space:]]*//')
        
        # Extract database queries
        while IFS= read -r line; do
            [[ -z "$line" ]] && continue
            DATABASE_QUERIES+=("$line")
        done < <(grep -r "SELECT\|INSERT\|UPDATE\|DELETE\|findOne\|findMany\|create\|update" . --include="*.js" --include="*.ts" --include="*.sql" 2>/dev/null | head -5 | cut -d: -f2- | sed 's/^[[:space:]]*//')
    fi
    
    # Configuration snippets
    if [[ -f package.json ]]; then
        CONFIG_SNIPPETS+=($(jq -c '.scripts // {}' package.json))
    fi
    
    update_json '.extracted_code_samples.main_functions' "$(printf '%s\n' "${MAIN_FUNCTIONS[@]:-}" | jq -R . | jq -s .)"
    update_json '.extracted_code_samples.api_endpoints' "$(printf '%s\n' "${API_ENDPOINTS[@]:-}" | jq -R . | jq -s .)"
    update_json '.extracted_code_samples.database_queries' "$(printf '%s\n' "${DATABASE_QUERIES[@]:-}" | jq -R . | jq -s .)"
    update_json '.extracted_code_samples.configuration_snippets' "$(printf '%s\n' "${CONFIG_SNIPPETS[@]:-}" | jq -R . | jq -s .)"
}

# 7. Extract File Contents
extract_file_contents() {
    echo -e "${CYAN}📄 Extracting key file contents...${NC}"
    
    # Package.json
    if [[ -f package.json ]]; then
        local PKG_CONTENT=$(cat package.json | jq -c .)
        update_json '.file_contents.package_json' "$PKG_CONTENT"
    fi
    
    # README.md (first 1000 characters)
    if [[ -f README.md ]]; then
        local README_CONTENT=$(head -c 1000 README.md | jq -R -s .)
        update_json '.file_contents.readme_content' "$README_CONTENT"
    fi
    
    # .env.example
    if [[ -f .env.example ]]; then
        local ENV_CONTENT=$(cat .env.example | jq -R -s .)
        update_json '.file_contents.env_example' "$ENV_CONTENT"
    fi
    
    # Docker configuration
    if [[ -f Dockerfile ]]; then
        local DOCKER_CONTENT=$(head -20 Dockerfile | jq -R -s .)
        update_json '.file_contents.docker_config' "$DOCKER_CONTENT"
    fi
    
    # CI configuration
    if [[ -f .github/workflows/main.yml ]]; then
        local CI_CONTENT=$(head -20 .github/workflows/main.yml | jq -R -s .)
        update_json '.file_contents.ci_config' "$CI_CONTENT"
    fi
    
    # Main entry file content (first 500 characters)
    for entry in index.js index.ts main.js main.ts app.js app.ts; do
        if [[ -f "$entry" ]]; then
            local ENTRY_CONTENT=$(head -c 500 "$entry" | jq -R -s .)
            update_json '.file_contents.main_entry_file' "$ENTRY_CONTENT"
            break
        fi
    done
}

# 8. AI Insights Generation
generate_ai_insights() {
    echo -e "${CYAN}🧠 Generating AI insights...${NC}"
    
    local PROJECT_PURPOSE=""
    local COMPLEXITY_LEVEL=""
    local DEVELOPMENT_STAGE=""
    local TEAM_SIZE=""
    local MAINTENANCE_EFFORT=""
    local SCALABILITY_POTENTIAL=""
    local BUSINESS_VALUE=""
    local TECHNICAL_DEBT=""
    local INNOVATION_SCORE=""
    local RECOMMENDATIONS=()
    
    # Extract current data for analysis
    local TOTAL_FILES=$(echo "$JSON_OUTPUT" | jq -r '.codebase_structure.total_files')
    local CODE_FILES=$(echo "$JSON_OUTPUT" | jq -r '.codebase_structure.code_files')
    local TOTAL_LOC=$(echo "$JSON_OUTPUT" | jq -r '.codebase_structure.total_lines_of_code')
    local FEATURES_COUNT=$(echo "$JSON_OUTPUT" | jq -r '.business_logic.core_features | length')
    local DEPS_COUNT=0
    
    if [[ -f package.json ]]; then
        DEPS_COUNT=$(jq '(.dependencies // {} | length) + (.devDependencies // {} | length)' package.json)
    fi
    
    # Project purpose inference
    local DOMAIN=$(echo "$JSON_OUTPUT" | jq -r '.project_identification.business_domain // ""')
    case "$DOMAIN" in
        "E-commerce") PROJECT_PURPOSE="E-commerce platform for online retail sales" ;;
        "Authentication") PROJECT_PURPOSE="Authentication and identity management service" ;;
        "Content Management") PROJECT_PURPOSE="Content management and publishing system" ;;
        "API Services") PROJECT_PURPOSE="Backend API service for application integration" ;;
        "Admin/Dashboard") PROJECT_PURPOSE="Administrative dashboard and management interface" ;;
        "Communication") PROJECT_PURPOSE="Communication and messaging platform" ;;
        *) 
            if [[ $FEATURES_COUNT -gt 5 ]]; then
                PROJECT_PURPOSE="Multi-feature application platform"
            elif [[ $FEATURES_COUNT -gt 2 ]]; then
                PROJECT_PURPOSE="Feature-rich web application"
            else
                PROJECT_PURPOSE="Single-purpose application or service"
            fi
            ;;
    esac
    
    # Complexity assessment
    local COMPLEXITY_SCORE=$((TOTAL_FILES + CODE_FILES + TOTAL_LOC/100 + DEPS_COUNT*2 + FEATURES_COUNT*10))
    if [[ $COMPLEXITY_SCORE -gt 1000 ]]; then
        COMPLEXITY_LEVEL="Enterprise (High complexity)"
    elif [[ $COMPLEXITY_SCORE -gt 500 ]]; then
        COMPLEXITY_LEVEL="Advanced (Medium-high complexity)"
    elif [[ $COMPLEXITY_SCORE -gt 200 ]]; then
        COMPLEXITY_LEVEL="Intermediate (Medium complexity)"
    else
        COMPLEXITY_LEVEL="Simple (Low complexity)"
    fi
    
    # Development stage
    local HAS_TESTS=$(echo "$JSON_OUTPUT" | jq -r '.technology_stack.testing_frameworks | length')
    local HAS_CI=$(echo "$JSON_OUTPUT" | jq -r '.file_contents.ci_config != null')
    local HAS_DOCKER=$(echo "$JSON_OUTPUT" | jq -r '.file_contents.docker_config != null')
    
    if [[ $HAS_TESTS -gt 0 && $HAS_CI == "true" && $HAS_DOCKER == "true" ]]; then
        DEVELOPMENT_STAGE="Production Ready"
    elif [[ $HAS_TESTS -gt 0 && ($HAS_CI == "true" || $HAS_DOCKER == "true") ]]; then
        DEVELOPMENT_STAGE="Pre-Production"
    elif [[ $FEATURES_COUNT -gt 3 ]]; then
        DEVELOPMENT_STAGE="Active Development"
    else
        DEVELOPMENT_STAGE="Early Development"
    fi
    
    # Team size estimation
    if [[ $COMPLEXITY_SCORE -gt 1500 ]]; then
        TEAM_SIZE="Large team (10+ developers)"
    elif [[ $COMPLEXITY_SCORE -gt 800 ]]; then
        TEAM_SIZE="Medium team (5-10 developers)"
    elif [[ $COMPLEXITY_SCORE -gt 300 ]]; then
        TEAM_SIZE="Small team (2-5 developers)"
    else
        TEAM_SIZE="Individual or pair (1-2 developers)"
    fi
    
    # Business value assessment
    local HAS_PAYMENT=$(echo "$JSON_OUTPUT" | jq -r '.business_logic.payment_processing')
    local HAS_AUTH=$(echo "$JSON_OUTPUT" | jq -r '.business_logic.core_features | map(select(. == "User Authentication")) | length > 0')
    
    if [[ $HAS_PAYMENT == "true" && $FEATURES_COUNT -gt 5 ]]; then
        BUSINESS_VALUE="High (Revenue-generating platform)"
    elif [[ $FEATURES_COUNT -gt 3 && $DEVELOPMENT_STAGE == "Production Ready" ]]; then
        BUSINESS_VALUE="Medium-High (Operational platform)"
    elif [[ $FEATURES_COUNT -gt 2 ]]; then
        BUSINESS_VALUE="Medium (Functional application)"
    else
        BUSINESS_VALUE="Low-Medium (Basic functionality)"
    fi
    
    # Technical debt assessment
    local DEBT_SCORE=0
    [[ ! -f .gitignore ]] && ((DEBT_SCORE++))
    [[ ! -f README.md ]] && ((DEBT_SCORE++))
    [[ $HAS_TESTS -eq 0 ]] && ((DEBT_SCORE += 2))
    [[ ! -f package-lock.json && ! -f yarn.lock ]] && ((DEBT_SCORE++))
    
    if [[ $DEBT_SCORE -gt 3 ]]; then
        TECHNICAL_DEBT="High (Multiple missing best practices)"
    elif [[ $DEBT_SCORE -gt 1 ]]; then
        TECHNICAL_DEBT="Medium (Some missing configurations)"
    else
        TECHNICAL_DEBT="Low (Well-configured project)"
    fi
    
    # Innovation score
    local INNOVATION_POINTS=0
    echo "$JSON_OUTPUT" | jq -e '.technology_stack.frontend_technologies | map(select(. == "React" or . == "Next.js" or . == "Vue.js")) | length > 0' >/dev/null && ((INNOVATION_POINTS++))
    echo "$JSON_OUTPUT" | jq -e '.technology_stack.backend_technologies | map(select(. == "Prisma" or . == "FastAPI" or . == "GraphQL")) | length > 0' >/dev/null && ((INNOVATION_POINTS++))
    [[ $HAS_DOCKER == "true" ]] && ((INNOVATION_POINTS++))
    echo "$JSON_OUTPUT" | jq -e '.technology_stack.build_tools | map(select(. == "Vite" or . == "ESBuild")) | length > 0' >/dev/null && ((INNOVATION_POINTS++))
    
    if [[ $INNOVATION_POINTS -gt 3 ]]; then
        INNOVATION_SCORE="High (Modern tech stack)"
    elif [[ $INNOVATION_POINTS -gt 1 ]]; then
        INNOVATION_SCORE="Medium (Some modern technologies)"
    else
        INNOVATION_SCORE="Low (Traditional technologies)"
    fi
    
    # Generate recommendations
    [[ ! -f .gitignore ]] && RECOMMENDATIONS+=("Add .gitignore file")
    [[ ! -f README.md ]] && RECOMMENDATIONS+=("Create comprehensive README.md")
    [[ $HAS_TESTS -eq 0 ]] && RECOMMENDATIONS+=("Implement testing framework")
    [[ $HAS_CI == "false" ]] && RECOMMENDATIONS+=("Set up CI/CD pipeline")
    [[ $HAS_DOCKER == "false" ]] && RECOMMENDATIONS+=("Add Docker containerization")
    [[ ! -f .env.example ]] && RECOMMENDATIONS+=("Add .env.example file")
    
    update_json '.ai_insights.project_purpose' "\"$PROJECT_PURPOSE\""
    update_json '.ai_insights.complexity_level' "\"$COMPLEXITY_LEVEL\""
    update_json '.ai_insights.development_stage' "\"$DEVELOPMENT_STAGE\""
    update_json '.ai_insights.team_size_estimate' "\"$TEAM_SIZE\""
    update_json '.ai_insights.business_value' "\"$BUSINESS_VALUE\""
    update_json '.ai_insights.technical_debt_level' "\"$TECHNICAL_DEBT\""
    update_json '.ai_insights.innovation_score' "\"$INNOVATION_SCORE\""
# === ADVANCED ANALYSIS MODULES ===

# 🔁 Detect duplicated code blocks
detect_code_duplication() {
    echo -e "${CYAN}🔁 Analyzing code duplication...${NC}"
    
    local DUPLICATION_SCORE="unknown"
    local POTENTIAL_DUPLICATES=0
    
    # Simple duplication detection using function signatures and similar patterns
    if [[ -d . ]]; then
        # Count similar function patterns (basic heuristic)
        local FUNCTION_PATTERNS=$(grep -r "function\|const.*=.*=>" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | \
            sed 's/.*function\s*\([^(]*\).*/\1/' | \
            sed 's/.*const\s*\([^=]*\).*/\1/' | \
            sort | uniq -c | sort -nr | awk '$1 > 1 {print $1}' | wc -l)
        
        # Estimate duplication based on similar patterns
        if [[ $FUNCTION_PATTERNS -gt 20 ]]; then
            DUPLICATION_SCORE="high"
        elif [[ $FUNCTION_PATTERNS -gt 10 ]]; then
            DUPLICATION_SCORE="medium"
        elif [[ $FUNCTION_PATTERNS -gt 5 ]]; then
            DUPLICATION_SCORE="low"
        else
            DUPLICATION_SCORE="minimal"
        fi
        
        POTENTIAL_DUPLICATES=$FUNCTION_PATTERNS
    fi
    
    update_json '.advanced_metrics.code_duplication_score' "\"$DUPLICATION_SCORE\""
    update_json '.advanced_metrics.potential_duplicates' "$POTENTIAL_DUPLICATES"
}

# 🔗 Check outdated dependencies
check_dependency_status() {
    echo -e "${CYAN}🔗 Checking dependency status...${NC}"
    
    local OUTDATED_COUNT=0
    local TOTAL_DEPS=0
    local SECURITY_VULNERABILITIES=0
    local DEPRECATED_PACKAGES=()
    
    if [[ -f package.json ]]; then
        TOTAL_DEPS=$(jq '(.dependencies // {}) * (.devDependencies // {}) | length' package.json 2>/dev/null || echo 0)
        
        # Check for commonly known outdated/deprecated packages
        local ALL_DEPS=$(jq -r '(.dependencies // {}) * (.devDependencies // {}) | keys[]' package.json 2>/dev/null || echo "")
        
        while IFS= read -r dep; do
            [[ -z "$dep" ]] && continue
            
            case "$dep" in
                # Known deprecated packages
                "request") DEPRECATED_PACKAGES+=("request (deprecated)") ;;
                "moment") DEPRECATED_PACKAGES+=("moment (legacy, consider date-fns)") ;;
                "node-sass") DEPRECATED_PACKAGES+=("node-sass (deprecated, use sass)") ;;
                "gulp") DEPRECATED_PACKAGES+=("gulp (consider modern alternatives)") ;;
                # Major version outdated indicators
                "react"*) 
                    local react_version=$(jq -r '.dependencies.react // .devDependencies.react // ""' package.json | sed 's/[^0-9].*//')
                    [[ -n "$react_version" && "$react_version" -lt 17 ]] && ((OUTDATED_COUNT++))
                    ;;
                "express"*)
                    local express_version=$(jq -r '.dependencies.express // ""' package.json | sed 's/[^0-9].*//')
                    [[ -n "$express_version" && "$express_version" -lt 4 ]] && ((OUTDATED_COUNT++))
                    ;;
            esac
        done <<< "$ALL_DEPS"
        
        # Basic vulnerability check (look for known vulnerable patterns)
        if echo "$ALL_DEPS" | grep -q "lodash\|minimist\|serialize-javascript"; then
            ((SECURITY_VULNERABILITIES++))
        fi
    fi
    
    update_json '.advanced_metrics.outdated_dependency_count' "$OUTDATED_COUNT"
    update_json '.advanced_metrics.total_dependencies' "$TOTAL_DEPS"
    update_json '.advanced_metrics.deprecated_packages' "$(printf '%s\n' "${DEPRECATED_PACKAGES[@]:-}" | jq -R . | jq -s .)"
    update_json '.advanced_metrics.potential_vulnerabilities' "$SECURITY_VULNERABILITIES"
}

# 📈 Parse test coverage percentage
analyze_test_coverage() {
    echo -e "${CYAN}📈 Analyzing test coverage...${NC}"
    
    local COVERAGE="unknown"
    local COVERAGE_FILES=()
    local TEST_FILE_COUNT=0
    local ASSERTION_COUNT=0
    
    # Check for coverage reports
    if [[ -f coverage/coverage-summary.json ]]; then
        COVERAGE=$(jq -r '.total.lines.pct // "unknown"' coverage/coverage-summary.json 2>/dev/null)
        COVERAGE_FILES+=("coverage-summary.json")
    elif [[ -f coverage/lcov.info ]]; then
        # Extract coverage from lcov file
        local lines_found=$(grep "LF:" coverage/lcov.info | awk -F: '{sum+=$2} END {print sum}' || echo 0)
        local lines_hit=$(grep "LH:" coverage/lcov.info | awk -F: '{sum+=$2} END {print sum}' || echo 0)
        if [[ $lines_found -gt 0 ]]; then
            COVERAGE=$(echo "scale=2; $lines_hit * 100 / $lines_found" | bc 2>/dev/null || echo "unknown")
        fi
        COVERAGE_FILES+=("lcov.info")
    elif [[ -f .nyc_output/coverage-summary.json ]]; then
        COVERAGE=$(jq -r '.total.lines.pct // "unknown"' .nyc_output/coverage-summary.json 2>/dev/null)
        COVERAGE_FILES+=(".nyc_output/coverage-summary.json")
    fi
    
    # Count test files and basic assertions
    TEST_FILE_COUNT=$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "*test.js" -o -name "*spec.js" | wc -l)
    
    if [[ $TEST_FILE_COUNT -gt 0 ]]; then
        ASSERTION_COUNT=$(grep -r "expect\|assert\|should\|it(" . --include="*.test.*" --include="*.spec.*" 2>/dev/null | wc -l)
    fi
    
    update_json '.advanced_metrics.test_coverage_percentage' "\"$COVERAGE\""
    update_json '.advanced_metrics.coverage_files' "$(printf '%s\n' "${COVERAGE_FILES[@]:-}" | jq -R . | jq -s .)"
    update_json '.advanced_metrics.test_file_count' "$TEST_FILE_COUNT"
    update_json '.advanced_metrics.assertion_count' "$ASSERTION_COUNT"
}

# 🚨 Analyze logging quality
analyze_log_quality() {
    echo -e "${CYAN}🚨 Analyzing logging quality...${NC}"
    
    local CONSOLE_COUNT=0
    local LOGGER_COUNT=0
    local LOG_LEVELS=()
    local STRUCTURED_LOGGING=false
    
    if [[ -d . ]]; then
        # Count console.log usage
        CONSOLE_COUNT=$(grep -r "console\.\(log\|error\|warn\|info\|debug\)" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        
        # Count structured logger usage
        LOGGER_COUNT=$(grep -r "winston\|pino\|bunyan\|log4js\|\.logger\|\.log\." . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        
        # Check for log levels
        if grep -r "\.error\|\.warn\|\.info\|\.debug\|\.trace" . --include="*.js" --include="*.ts" 2>/dev/null | head -1 >/dev/null; then
            LOG_LEVELS+=("error" "warn" "info" "debug")
        fi
        
        # Check for structured logging patterns
        if grep -r "winston\|pino\|bunyan" . --include="*.js" --include="*.ts" 2>/dev/null | head -1 >/dev/null; then
            STRUCTURED_LOGGING=true
        fi
    fi
    
    update_json '.advanced_metrics.console_logs_count' "$CONSOLE_COUNT"
    update_json '.advanced_metrics.structured_logs_count' "$LOGGER_COUNT"
    update_json '.advanced_metrics.log_levels' "$(printf '%s\n' "${LOG_LEVELS[@]:-}" | jq -R . | jq -s .)"
    update_json '.advanced_metrics.structured_logging_enabled' "$STRUCTURED_LOGGING"
}

# 🔀 Build import/export dependency graph
analyze_module_dependencies() {
    echo -e "${CYAN}🔀 Analyzing module dependencies...${NC}"
    
    local IMPORT_COUNT=0
    local EXPORT_COUNT=0
    local CIRCULAR_DEPS=0
    local MODULE_COUPLING="unknown"
    local EXTERNAL_IMPORTS=0
    local INTERNAL_IMPORTS=0
    
    if [[ -d . ]]; then
        # Count import statements
        IMPORT_COUNT=$(grep -r "^import \|^const.*require\|^import{" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        
        # Count export statements
        EXPORT_COUNT=$(grep -r "^export \|module\.exports\|exports\." . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        
        # Estimate external vs internal imports
        EXTERNAL_IMPORTS=$(grep -r "^import.*from ['\"][\w@]" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        INTERNAL_IMPORTS=$(grep -r "^import.*from ['\"][\.\/]" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        
        # Estimate module coupling
        local TOTAL_FILES=$(find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | wc -l)
        if [[ $TOTAL_FILES -gt 0 ]]; then
            local COUPLING_RATIO=$(echo "scale=2; $IMPORT_COUNT / $TOTAL_FILES" | bc 2>/dev/null || echo 0)
            if (( $(echo "$COUPLING_RATIO > 10" | bc -l) )); then
                MODULE_COUPLING="high"
            elif (( $(echo "$COUPLING_RATIO > 5" | bc -l) )); then
                MODULE_COUPLING="medium"
            else
                MODULE_COUPLING="low"
            fi
        fi
    fi
    
    update_json '.advanced_metrics.import_statements_count' "$IMPORT_COUNT"
    update_json '.advanced_metrics.export_statements_count' "$EXPORT_COUNT"
    update_json '.advanced_metrics.external_imports' "$EXTERNAL_IMPORTS"
    update_json '.advanced_metrics.internal_imports' "$INTERNAL_IMPORTS"
    update_json '.advanced_metrics.module_coupling_score' "\"$MODULE_COUPLING\""
}

# 🔬 Cyclomatic complexity estimation
estimate_code_complexity() {
    echo -e "${CYAN}🔬 Estimating code complexity...${NC}"
    
    local COMPLEXITY_LEVEL="unknown"
    local COMPLEXITY_INDICATORS=0
    local NESTED_BLOCKS=0
    local CONDITIONAL_COUNT=0
    local LOOP_COUNT=0
    local FUNCTION_COUNT=0
    
    if [[ -d . ]]; then
        # Count complexity indicators
        CONDITIONAL_COUNT=$(grep -r "if\s*(\|switch\s*(\|case\s\|?\s*:" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        LOOP_COUNT=$(grep -r "for\s*(\|while\s*(\|forEach\|map\s*(\|filter\s*(" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        FUNCTION_COUNT=$(grep -r "function\s\|=>\s*{\|=>\s*[^{]" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        
        # Estimate nested blocks (simplified)
        NESTED_BLOCKS=$(grep -r "{\s*$" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        
        # Calculate complexity score
        COMPLEXITY_INDICATORS=$((CONDITIONAL_COUNT + LOOP_COUNT + NESTED_BLOCKS / 2))
        
        if [[ $FUNCTION_COUNT -gt 0 ]]; then
            local COMPLEXITY_RATIO=$(echo "scale=2; $COMPLEXITY_INDICATORS / $FUNCTION_COUNT" | bc 2>/dev/null || echo 0)
            if (( $(echo "$COMPLEXITY_RATIO > 5" | bc -l) )); then
                COMPLEXITY_LEVEL="high"
            elif (( $(echo "$COMPLEXITY_RATIO > 3" | bc -l) )); then
                COMPLEXITY_LEVEL="medium"
            else
                COMPLEXITY_LEVEL="low"
            fi
        fi
    fi
    
    update_json '.advanced_metrics.cyclomatic_complexity_level' "\"$COMPLEXITY_LEVEL\""
    update_json '.advanced_metrics.conditional_statements' "$CONDITIONAL_COUNT"
    update_json '.advanced_metrics.loop_statements' "$LOOP_COUNT"
    update_json '.advanced_metrics.function_count' "$FUNCTION_COUNT"
    update_json '.advanced_metrics.complexity_score' "$COMPLEXITY_INDICATORS"
}

# 🕵️ Detect dead code and unused imports
detect_dead_code() {
    echo -e "${CYAN}🕵️ Detecting dead code...${NC}"
    
    local DEAD_CODE_DETECTED=false
    local UNUSED_IMPORTS=0
    local UNREACHABLE_CODE=0
    local DEAD_CODE_INDICATORS=()
    
    if [[ -d . ]]; then
        # Look for common dead code patterns
        local TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX\|HACK" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        local COMMENTED_CODE=$(grep -r "//.*[{}();]" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        
        # Check for unused variables (basic pattern)
        local UNUSED_VARS=$(grep -r "const\s\+\w\+\s*=" . --include="*.js" --include="*.ts" 2>/dev/null | wc -l)
        
        if [[ $TODO_COUNT -gt 10 || $COMMENTED_CODE -gt 20 ]]; then
            DEAD_CODE_DETECTED=true
            DEAD_CODE_INDICATORS+=("High TODO/commented code count")
        fi
        
        # Look for unreachable code patterns
        UNREACHABLE_CODE=$(grep -r "return.*;\s*\w" . --include="*.js" --include="*.ts" 2>/dev/null | wc -l)
    fi
    
    update_json '.advanced_metrics.dead_code_detected' "$DEAD_CODE_DETECTED"
    update_json '.advanced_metrics.todo_fixme_count' "$TODO_COUNT"
    update_json '.advanced_metrics.commented_code_lines' "$COMMENTED_CODE"
    update_json '.advanced_metrics.dead_code_indicators' "$(printf '%s\n' "${DEAD_CODE_INDICATORS[@]:-}" | jq -R . | jq -s .)"
}

# 🚀 Performance bottleneck detection
detect_performance_bottlenecks() {
    echo -e "${CYAN}🚀 Detecting performance bottlenecks...${NC}"
    
    local BOTTLENECKS=()
    local SYNC_OPERATIONS=0
    local LARGE_LOOPS=0
    local DB_QUERIES_IN_LOOPS=0
    
    if [[ -d . ]]; then
        # Synchronous operations
        SYNC_OPERATIONS=$(grep -r "readFileSync\|writeFileSync\|execSync" . --include="*.js" --include="*.ts" 2>/dev/null | wc -l)
        [[ $SYNC_OPERATIONS -gt 0 ]] && BOTTLENECKS+=("Synchronous file operations detected")
        
        # Nested loops
        LARGE_LOOPS=$(grep -r "for.*for\|while.*while" . --include="*.js" --include="*.ts" 2>/dev/null | wc -l)
        [[ $LARGE_LOOPS -gt 5 ]] && BOTTLENECKS+=("Nested loops detected")
        
        # Database queries in loops
        DB_QUERIES_IN_LOOPS=$(grep -r -A5 -B5 "for\|while" . --include="*.js" --include="*.ts" 2>/dev/null | grep -c "query\|find\|select" || echo 0)
        [[ $DB_QUERIES_IN_LOOPS -gt 0 ]] && BOTTLENECKS+=("Potential N+1 query problems")
        
        # Memory-intensive operations
        local MEMORY_OPS=$(grep -r "JSON\.parse\|JSON\.stringify.*large\|Buffer\.alloc" . --include="*.js" --include="*.ts" 2>/dev/null | wc -l)
        [[ $MEMORY_OPS -gt 10 ]] && BOTTLENECKS+=("Memory-intensive operations")
    fi
    
    update_json '.advanced_metrics.performance_bottlenecks' "$(printf '%s\n' "${BOTTLENECKS[@]:-}" | jq -R . | jq -s .)"
    update_json '.advanced_metrics.sync_operations_count' "$SYNC_OPERATIONS"
}

# 🔒 Security hotspot detection
detect_security_hotspots() {
    echo -e "${CYAN}🔒 Detecting security hotspots...${NC}"
    
    local SECURITY_HOTSPOTS=()
    local HARDCODED_SECRETS=0
    local SQL_INJECTION_RISK=0
    local XSS_RISK=0
    
    if [[ -d . ]]; then
        # Hardcoded secrets
        HARDCODED_SECRETS=$(grep -r "password\s*=\s*['\"][^'\"]\|api.*key\s*=\s*['\"][^'\"]\|secret\s*=\s*['\"][^'\"]\|token\s*=\s*['\"][^'\"]" . --include="*.js" --include="*.ts" --exclude="*.example.*" 2>/dev/null | wc -l)
        [[ $HARDCODED_SECRETS -gt 0 ]] && SECURITY_HOTSPOTS+=("Potential hardcoded secrets")
        
        # SQL injection risks
        SQL_INJECTION_RISK=$(grep -r "query.*+\|exec.*+\|SELECT.*\${" . --include="*.js" --include="*.ts" 2>/dev/null | wc -l)
        [[ $SQL_INJECTION_RISK -gt 0 ]] && SECURITY_HOTSPOTS+=("SQL injection risks")
        
        # XSS risks
        XSS_RISK=$(grep -r "innerHTML\|document\.write\|eval(" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l)
        [[ $XSS_RISK -gt 0 ]] && SECURITY_HOTSPOTS+=("XSS vulnerabilities")
        
        # Insecure HTTP usage
        local INSECURE_HTTP=$(grep -r "http://\|ftp://" . --include="*.js" --include="*.ts" 2>/dev/null | wc -l)
        [[ $INSECURE_HTTP -gt 0 ]] && SECURITY_HOTSPOTS+=("Insecure HTTP connections")
    fi
    
    update_json '.advanced_metrics.security_hotspots' "$(printf '%s\n' "${SECURITY_HOTSPOTS[@]:-}" | jq -R . | jq -s .)"
    update_json '.advanced_metrics.hardcoded_secrets_count' "$HARDCODED_SECRETS"
    update_json '.advanced_metrics.sql_injection_risks' "$SQL_INJECTION_RISK"
    update_json '.advanced_metrics.xss_risks' "$XSS_RISK"
}

# Advanced analysis runner
run_advanced_analysis() {
    echo -e "${BOLD}${PURPLE}🔬 Running Advanced Code Analysis...${NC}"
    
    detect_code_duplication
    check_dependency_status
    analyze_test_coverage
    analyze_log_quality
    analyze_module_dependencies
    estimate_code_complexity
    detect_dead_code
    detect_performance_bottlenecks
    detect_security_hotspots
}

# === END ADVANCED ANALYSIS MODULES ===

# Main execution function
main() {
    echo -e "${BOLD}${PURPLE}═══════════════════════════════════════${NC}"
    echo -e "${BOLD}${PURPLE}  AI-Ready Project Analyzer v$VERSION  ${NC}"
    echo -e "${BOLD}${PURPLE}═══════════════════════════════════════${NC}"
    echo ""
    
    # Check for jq dependency
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ Error: jq is required but not installed.${NC}"
        echo -e "${YELLOW}Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)${NC}"
        exit 1
    fi
    
    # Initialize JSON structure
    initialize_json
    
    # Run all analysis modules
    analyze_project_identification
    analyze_codebase_structure
    analyze_technology_stack
    analyze_api_architecture
    analyze_business_logic
    extract_code_samples
    extract_file_contents
    run_advanced_analysis
    run_enhanced_analysis
    generate_ai_insights
    
    # Update analysis duration
    local END_TIME=$(date +%s)
    local DURATION=$((END_TIME - START_TIME))
    update_json '.metadata.analysis_duration_seconds' "$DURATION"
    
    echo ""
    echo -e "${GREEN}✅ Analysis completed in ${DURATION}s${NC}"
    echo -e "${BOLD}${CYAN}📊 Exporting comprehensive project data for AI...${NC}"
    echo ""
    
    # Output the final JSON
    echo "$JSON_OUTPUT" | jq '.'
    
    echo ""
    echo -e "${BOLD}${GREEN}🎯 Analysis Complete!${NC}"
    echo -e "${YELLOW}📋 The above JSON contains comprehensive project data optimized for AI understanding.${NC}"
    echo -e "${CYAN}💡 Copy this output and provide it to any AI system for near-perfect project comprehension.${NC}"
}

# Run the analyzer
main "$@"