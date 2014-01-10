module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      ci: {
        singleRun: true
      },
      dev: {
        background: true
      }
    },
    connect: {
      options: {
        livereload: true,
        port: 9000,
        open: 'http://localhost:<%= connect.options.port %>/demo/tree-controll.html'
      },
      server: {
      }
    },
    watch: {
      options: {
        livereload: true
      },
      tests: {
        files: ['*.js', 'test/**/*.js', '{demo,css,images}/*.*'],
        tasks: ['karma:dev:run']
      }
    },
    release: {
      options: {
        file: 'bower.json',
        npm: false,
      }
    }
  });

  //run tests only once (continuous integration mode)
  grunt.registerTask('test', ['karma:ci']);

  //to debug tests during 'grunt serve', open: http://localhost:8880/debug.html
  grunt.registerTask('serve', ['karma:dev', 'connect', 'watch']);
};
