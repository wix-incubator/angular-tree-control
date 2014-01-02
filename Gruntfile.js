module.exports = function(grunt) {
  grunt.initConfig({
    release: {
      options: {
        file: 'bower.json',
        npm: false,
        github: {
          repo: 'wix/angular-tree-control',
          usernameVar: 'GITHUB_USERNAME',
          passwordVar: 'GITHUB_PASSWORD'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-release');
};
