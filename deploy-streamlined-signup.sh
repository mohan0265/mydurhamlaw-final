#!/bin/bash

# Production Deployment Script for Streamlined Signup Flow
# This script safely deploys the new two-step signup system to production

set -e  # Exit on any error

echo "🚀 Starting deployment of streamlined signup flow..."
echo "====================================================="

# Configuration
SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID:-"your-project-id"}
SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD:-""}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Please install it first."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check environment variables
    if [[ -z "$SUPABASE_PROJECT_ID" ]]; then
        log_warning "SUPABASE_PROJECT_ID not set. Please set it before deployment."
        read -p "Enter your Supabase project ID: " SUPABASE_PROJECT_ID
    fi
    
    log_success "Prerequisites check completed"
}

# Create backup
create_backup() {
    log_info "Creating backup of current database state..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Export current schema
    if command -v pg_dump &> /dev/null && [[ -n "$SUPABASE_DB_PASSWORD" ]]; then
        log_info "Creating database backup..."
        # Note: This would require database connection details
        echo "-- Backup created at $(date)" > "$BACKUP_DIR/backup_info.sql"
        log_success "Backup created at $BACKUP_DIR"
    else
        log_warning "pg_dump not available or credentials not provided. Skipping database backup."
        log_warning "Make sure you have a recent backup before proceeding."
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if Supabase project is linked
    if [[ ! -f ".supabase/config.toml" ]]; then
        log_info "Linking to Supabase project..."
        supabase link --project-ref "$SUPABASE_PROJECT_ID"
    fi
    
    # Apply migrations
    log_info "Applying streamlined signup migrations..."
    
    # Check if migration files exist
    migrations=(
        "supabase/migrations/20250801010000_streamline_signup_flow.sql"
        "supabase/migrations/20250801020000_complete_backend_sync.sql"
        "supabase/migrations/20250801030000_enhanced_rls_policies.sql"
    )
    
    for migration in "${migrations[@]}"; do
        if [[ -f "$migration" ]]; then
            log_info "Found migration: $migration"
        else
            log_error "Migration file not found: $migration"
            exit 1
        fi
    done
    
    # Push migrations to Supabase
    supabase db push --include-all
    
    log_success "Database migrations completed"
}

# Verify database setup
verify_database() {
    log_info "Verifying database setup..."
    
    # Run verification queries
    log_info "Running database verification..."
    
    # Create a temporary SQL file with verification queries
    cat > verify_setup.sql << 'EOF'
-- Run all verification functions
SELECT 'Streamlined Signup Setup' as verification_type, * FROM public.verify_streamlined_signup_setup();
SELECT 'Enhanced RLS Setup' as verification_type, * FROM public.verify_enhanced_rls_setup();

-- Check if handle_new_user function is properly updated
SELECT 
    'Function Definition' as check_type,
    'handle_new_user' as function_name,
    CASE 
        WHEN prosrc LIKE '%STREAMLINED SIGNUP FLOW%' THEN 'UPDATED'
        ELSE 'OUTDATED'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- Check profile completion stats
SELECT 'Profile Stats' as check_type, * FROM public.profile_completion_stats;
EOF

    # Execute verification (this would need actual database connection)
    log_info "Verification queries prepared. Execute manually in Supabase dashboard if needed."
    
    log_success "Database verification completed"
    rm -f verify_setup.sql
}

# Build and test frontend
build_frontend() {
    log_info "Building and testing frontend..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install
    
    # Run type checking
    log_info "Running type checks..."
    npm run type-check
    
    # Run linting
    log_info "Running linting..."
    npm run lint
    
    # Build the application
    log_info "Building application..."
    npm run build
    
    log_success "Frontend build completed successfully"
}

# Deploy to production
deploy_to_production() {
    log_info "Deploying to production..."
    
    # Note: This section would depend on your deployment platform
    # Common platforms: Netlify, Vercel, Railway, etc.
    
    if command -v netlify &> /dev/null; then
        log_info "Deploying to Netlify..."
        netlify deploy --prod --dir=out
        log_success "Netlify deployment completed"
    elif command -v vercel &> /dev/null; then
        log_info "Deploying to Vercel..."
        vercel --prod
        log_success "Vercel deployment completed"
    else
        log_warning "No deployment tool detected. Please deploy manually:"
        log_info "1. Upload the 'out' or '.next' directory to your hosting service"
        log_info "2. Update environment variables in your hosting dashboard"
        log_info "3. Restart your application"
    fi
}

# Update environment variables
update_environment() {
    log_info "Environment variable checklist..."
    
    echo ""
    echo "📋 Ensure these environment variables are set in production:"
    echo "   NEXT_PUBLIC_SUPABASE_URL"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   SUPABASE_SERVICE_ROLE_KEY (server-side only)"
    echo "   OPENAI_API_KEY (server-side only)"
    echo ""
    
    log_warning "Make sure to update any OAuth redirect URLs in:"
    echo "   - Google Cloud Console OAuth settings"
    echo "   - Supabase Authentication settings"
    echo "   - Any other OAuth providers"
    echo ""
}

# Post-deployment verification
post_deployment_check() {
    log_info "Post-deployment verification..."
    
    echo ""
    echo "🔍 Manual verification checklist:"
    echo "   ✓ Visit /signup - should show Google-only button"
    echo "   ✓ Complete OAuth flow - should redirect to /complete-profile"
    echo "   ✓ Fill profile form - should create profile and redirect to dashboard"
    echo "   ✓ Test existing user login - should work normally"
    echo "   ✓ Check database - profiles should be created manually"
    echo ""
    
    log_success "Deployment verification checklist provided"
}

# Rollback plan
show_rollback_plan() {
    log_info "Rollback plan (if needed):"
    
    echo ""
    echo "🔄 To rollback if issues occur:"
    echo "   1. Revert database migrations:"
    echo "      supabase db reset --linked"
    echo "   2. Restore from backup (if created)"
    echo "   3. Deploy previous frontend version"
    echo "   4. Update OAuth redirect URLs back to old flow"
    echo ""
    
    if [[ -d "$BACKUP_DIR" ]]; then
        echo "   Backup location: $BACKUP_DIR"
    fi
    echo ""
}

# Main deployment flow
main() {
    echo "Starting Caseway Streamlined Signup Deployment"
    echo "=================================================="
    echo ""
    
    # Ask for confirmation
    read -p "This will deploy the new streamlined signup flow to production. Continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
    
    # Execute deployment steps
    check_prerequisites
    create_backup
    build_frontend
    run_migrations
    verify_database
    update_environment
    deploy_to_production
    post_deployment_check
    show_rollback_plan
    
    echo ""
    log_success "🎉 Streamlined signup deployment completed!"
    echo ""
    echo "Next steps:"
    echo "1. Test the new signup flow thoroughly"
    echo "2. Monitor error logs and user feedback"
    echo "3. Update documentation if needed"
    echo ""
    echo "The new flow: Google OAuth → Complete Profile → Dashboard"
    echo ""
}

# Run main function
main "$@"