/**
 * This file is used to configure pnpm for better compatibility
 * and to ensure consistent package resolution across environments
 */

function readPackage(pkg, context) {
  // Ensure peer dependencies are properly installed
  if (pkg.name === '@types/node') {
    pkg.dependencies = pkg.dependencies || {};
  }

  // Fix potential hoisting issues
  if (pkg.dependencies) {
    // Add any specific dependency resolutions here if needed
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  },
  
  // Prevent phantom dependencies
  'auto-install-peers': true,
  
  // Use strict peer dependencies
  'strict-peer-dependencies': false,
  
  // Shamefully hoist packages to avoid compatibility issues
  'shamefully-hoist': false,
  
  // Dedupe packages
  'dedupe-peer-dependents': true
};