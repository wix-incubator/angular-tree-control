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
            },
            angular3: {
                background: true,
                options: {
                    files: [
                        'bower_components/jquery/dist/jquery.js',
                        'demo/angular.1.3.12.js',
                        'demo/angular-mocks.1.3.12.js',
                        'angular-tree-control.js',
                        'test/**/*.js'
                    ]
                }
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
            },
            angular3: {
                files: ['*.js', 'test/**/*.js', '{demo,css,images}/*.*'],
                tasks: ['karma:angular3:run']
            }
        },
        release: {
            options: {
                additionalFiles: ['bower.json']
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
    grunt.registerTask('angular3', ['karma:angular3', 'watch:angular3']);
};
