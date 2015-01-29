module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-karma');

    grunt.initConfig({
        karma: {
            options: {
                configFile: 'karma.conf.js',
                browsers: ['Chrome']
            },
            ci: {
                singleRun: true,
                preprocessors: {'*.js': 'coverage'},
                reporters: ['progress', 'coverage'],
                coverageReporter: {type: 'lcov'}
            },
            ci_travis: {
                singleRun: true,
                preprocessors: {'*.js': 'coverage'},
                reporters: ['progress', 'coverage'],
                coverageReporter: {type: 'lcov'},
                browsers: ['PhantomJS']
            },
            dev: {
                background: true
            }
        },
        connect: {
            options: {
                livereload: true,
                port: 9000,
                open: 'http://localhost:<%= connect.options.port %>/index.html'
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
                npm: false
            }
        }
    });

    //run tests only once (continuous integration mode)
//  grunt.registerTask('test', ['karma:ci']);
    grunt.registerTask('test', function() {
        console.log("running on environment: ", process.env.TREE_CI_ENV);
        if (process.env.TREE_CI_ENV == 'travis') {
            grunt.task.run(['karma:ci_travis']);
        }
        else {
            grunt.task.run(['karma:ci']);
        }
    });

    //to debug tests during 'grunt serve', open: http://localhost:8880/debug.html
    grunt.registerTask('serve', ['karma:dev', 'connect', 'watch']);
};
