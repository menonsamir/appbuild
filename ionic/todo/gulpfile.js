var gulp = require('gulp');
var jade = require('gulp-jade');

var paths = {
  jade: ['./jade/**/*.jade']
};

gulp.task('default', ['jade']);

gulp.task('jade', function (done) {
    gulp.src(paths.jade)
      .pipe(jade({pretty: true}))
      .pipe(gulp.dest('./www/templates/'))
      .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.jade, ['jade']);
});
