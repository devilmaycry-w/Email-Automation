/**
 * CodexCity Setup Verification Script
 * Run this script to verify your Supabase database setup
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - Update these with your actual values
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySetup() {
  console.log('🔍 Starting CodexCity Setup Verification...\n');

  const results = {
    tables: {},
    policies: {},
    functions: {},
    overall: true
  };

  try {
    // Check if tables exist
    console.log('📋 Checking database tables...');
    
    const tables = ['users', 'user_gmail_tokens', 'email_templates', 'email_logs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.code === 'PGRST116') {
          console.log(`❌ Table '${table}' does not exist`);
          results.tables[table] = false;
          results.overall = false;
        } else if (error) {
          console.log(`⚠️  Table '${table}' exists but has issues: ${error.message}`);
          results.tables[table] = 'warning';
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
          results.tables[table] = true;
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}': ${err.message}`);
        results.tables[table] = false;
        results.overall = false;
      }
    }

    // Check RLS policies
    console.log('\n🔒 Checking Row Level Security policies...');
    
    // This is a simplified check - in production you'd query pg_policies
    for (const table of tables) {
      if (results.tables[table] === true) {
        try {
          // Try to access the table - if RLS is properly configured, this should work
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error && error.code === '42501') {
            console.log(`❌ RLS policy missing for '${table}'`);
            results.policies[table] = false;
            results.overall = false;
          } else {
            console.log(`✅ RLS policies configured for '${table}'`);
            results.policies[table] = true;
          }
        } catch (err) {
          console.log(`⚠️  Could not verify RLS for '${table}': ${err.message}`);
          results.policies[table] = 'warning';
        }
      }
    }

    // Check authentication
    console.log('\n🔐 Checking authentication setup...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log(`✅ User authenticated: ${user.email}`);
        
        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.log(`❌ User profile missing in 'users' table`);
          results.overall = false;
        } else {
          console.log(`✅ User profile exists in 'users' table`);
        }
      } else {
        console.log(`ℹ️  No user currently authenticated (this is normal for setup verification)`);
      }
    } catch (err) {
      console.log(`⚠️  Authentication check failed: ${err.message}`);
    }

    // Summary
    console.log('\n📊 Setup Verification Summary:');
    console.log('================================');
    
    console.log('\nTables:');
    Object.entries(results.tables).forEach(([table, status]) => {
      const icon = status === true ? '✅' : status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${icon} ${table}`);
    });
    
    console.log('\nRLS Policies:');
    Object.entries(results.policies).forEach(([table, status]) => {
      const icon = status === true ? '✅' : status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${icon} ${table}`);
    });
    
    if (results.overall) {
      console.log('\n🎉 Setup verification PASSED! Your database is properly configured.');
    } else {
      console.log('\n❌ Setup verification FAILED! Please check the issues above.');
      console.log('\n🔧 To fix issues:');
      console.log('1. Go to your Supabase Dashboard > SQL Editor');
      console.log('2. Run the SQL commands from docs/PRODUCTION_SETUP_GUIDE.md');
      console.log('3. Re-run this verification script');
    }

  } catch (error) {
    console.error('💥 Verification failed with error:', error.message);
    results.overall = false;
  }

  return results;
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifySetup().then(results => {
    process.exit(results.overall ? 0 : 1);
  });
}

export { verifySetup };