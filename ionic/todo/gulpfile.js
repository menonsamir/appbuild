var gulp = require('gulp');
var sass = require('gulp-sass');
var jade = require('gulp-jade');

var paths = {
  sass: ['./scss/**/*.scss'],
  jade: ['./jade/**/*.jade']
};

gulp.task('default', ['sass', 'jade']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('jade', function (done) {
    gulp.src(paths.jade)
      .pipe(jade({pretty: true}))
      .pipe(gulp.dest('./www/templates/'))
      .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.jade, ['jade']);
});
