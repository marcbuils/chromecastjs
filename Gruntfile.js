module.exports = function (grunt) {
    'use strict';

    var _ = require('lodash');
    var Q = require('q');

    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            dev: {
                files: [
                    'src/*.js', 'examples/*.html'
                ],
                tasks: [
                    'test'
                ],
                options: {
                    nospawn: true,
                    livereload: '<%= portscanner.portLiveReload %>'
                }
            }
        },

        jshint: {
            options: grunt.file.readJSON('./.jshintrc'),
            test: {
                files: {
                    src: [
                        'src/*.js'
                    ]
                },
            }
        },

        open: {
            dev: {
                path: 'http://localhost:<%= portscanner.port %>/examples/sender.html'
            },
            docs: {
                path: 'http://localhost:<%= portscanner.port %>/docs/readme.html'
            }
        },

        docco: {
            docs: {
                src: [
                      'README.md', 'src/*.js'
                ],
                options: {
                    output: 'docs/'
                }
            }
        },

        connect: {
            dev: {
                options: {
                    port: '<%= portscanner.port %>',
                    base: '',
                    middleware: function (connect) {
                        var connectLiveReload = require('connect-livereload');

                        return [
                            connectLiveReload({
                                port: grunt.config('portscanner.portLiveReload')
                            }), 
                            connect.static(require('path').resolve('./'))
                        ];
                    }
                }
            }
        },
        
        uglify: {
            dist: {
              files: {
                'chromecast.js': ['chromecast-bundle.js']
              }
            }
        },
        
        browserify: {
            dist: {
                files: {
                    'chromecast-bundle.js': ['src/chromecast.js']
                }
            }
        }
    });

    grunt.registerTask('portscanner', 'find a free tcp port', function () {
        var done = this.async();
        var Task = {
            initialize: function () {
                this.deferred = new Q();

                return this;
            },
            findPort: function (name) {
                var portscanner = require('portscanner');
                var deferred = Q.defer();

                this.deferred = this.deferred.then(function (p_port) {
                    var port = p_port || 5000;

                    portscanner.findAPortNotInUse(port, 6000, 'localhost', _.bind(function (error, port) {
                        grunt.config.set(name, port);

                        console.log(name, port);
                        deferred.resolve(port + 1);
                    }, this));

                    return deferred.promise;
                });

                return this;
            },
            execute: function () {
                this.findPort('portscanner.port').findPort('portscanner.portLiveReload');

                return this.deferred;
            }
        };

        Object.create(Task).initialize().execute().then(function () {
            done();
        });
    });

    
    grunt.registerTask('test', [
        'jshint:test', 'compile'
    ]);
    grunt.registerTask('default', [
        'test'
    ]);
    grunt.registerTask('serverdev', [
        'docco:docs', 'portscanner', 'connect:dev', 'open:docs', 'open:dev', 'watch'
    ]);
    grunt.registerTask('compile', [
         'browserify:dist', 'uglify:dist'
    ]);
};
