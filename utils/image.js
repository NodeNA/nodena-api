import { src, dest } from 'gulp';
import imagemin from 'gulp-imagemin';
import imageResize from 'gulp-image-resize';


function handleImg (filename) {
 return src(filename)
  .pipe(imagemin({optimizationLevel: 5}))
  .pipe(dest('./public/img'))
  .pipe(imageResize({
    width : 300,
    height : 200,
    crop : true,
    upscale : false
  }))
  .pipe(dest('./public/img/320'))

  .pipe(imageResize({
    width : 120,
    crop : false,
    upscale : false
  }))
  .pipe(dest('./public/img/120'))

  .pipe(imageResize({
    width : 48,
    height : 48,
    crop : true,
    upscale : false
  }))
  .pipe(dest('./public/img/48'));
}


process.on('message', function (images) {
  console.log('Image processing started...');
  var stream = handleImg(images);
  stream.on('end', function () {
    process.send('Image processing complete');
    process.exit();
  });
  stream.on('error', function (err) {
    process.send(err);
    process.exit(1);
  });
});

