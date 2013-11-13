module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    requirejs: {
      "default": {
        options: {
          baseUrl: ".",
          insertRequire: ["<%= pkg.name %>"],
          name: "<%= pkg.name %>",
          out: "dist/<%= pkg.name %>-<%= pkg.version %>.min.js"
        }
      }
    }
  });

  // Load RequireJS to trace dependencies
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  // Default task(s).
  grunt.registerTask('default', ['requirejs']);

};
