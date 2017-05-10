var __globals = this;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var numberIsNan = require('number-is-nan');

module.exports = Number.isFinite || function (val) {
	return !(typeof val !== 'number' || numberIsNan(val) || val === Infinity || val === -Infinity);
};

},{"number-is-nan":2}],2:[function(require,module,exports){
'use strict';

module.exports = Number.isNaN || function (x) {
	return x !== x;
};

},{}],3:[function(require,module,exports){
'use strict';

module.exports = function (ms) {
	if (typeof ms !== 'number') {
		throw new TypeError('Expected a number');
	}

	var roundTowardZero = ms > 0 ? Math.floor : Math.ceil;

	return {
		days: roundTowardZero(ms / 86400000),
		hours: roundTowardZero(ms / 3600000) % 24,
		minutes: roundTowardZero(ms / 60000) % 60,
		seconds: roundTowardZero(ms / 1000) % 60,
		milliseconds: roundTowardZero(ms) % 1000
	};
};

},{}],4:[function(require,module,exports){
'use strict';

module.exports = function (str, plural, count) {
	if (typeof plural === 'number') {
		count = plural;
		plural = str + 's';
	}

	return count === 1 ? str : plural;
};

},{}],5:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var numberIsNan = require('number-is-nan');

module.exports = function (num) {
	if (typeof num !== 'number' || numberIsNan(num)) {
		throw new TypeError('Expected a number, got ' + (typeof num === 'undefined' ? 'undefined' : _typeof(num)));
	}

	var exponent;
	var unit;
	var neg = num < 0;
	var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	if (neg) {
		num = -num;
	}

	if (num < 1) {
		return (neg ? '-' : '') + num + ' B';
	}

	exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
	num = Number((num / Math.pow(1000, exponent)).toFixed(2));
	unit = units[exponent];

	return (neg ? '-' : '') + num + ' ' + unit;
};

},{"number-is-nan":2}],6:[function(require,module,exports){
'use strict';

var parseMs = require('parse-ms');
var plur = require('plur');
var isFinitePonyfill = require('is-finite');

module.exports = function (ms, opts) {
	if (!isFinitePonyfill(ms)) {
		throw new TypeError('Expected a finite number');
	}

	opts = opts || {};

	if (ms < 1000) {
		var msDecimalDigits = typeof opts.msDecimalDigits === 'number' ? opts.msDecimalDigits : 0;
		return (msDecimalDigits ? ms.toFixed(msDecimalDigits) : Math.ceil(ms)) + (opts.verbose ? ' ' + plur('millisecond', Math.ceil(ms)) : 'ms');
	}

	var ret = [];

	var add = function add(val, long, short, valStr) {
		if (val === 0) {
			return;
		}

		var postfix = opts.verbose ? ' ' + plur(long, val) : short;

		ret.push((valStr || val) + postfix);
	};

	var parsed = parseMs(ms);

	add(parsed.days, 'day', 'd');
	add(parsed.hours, 'hour', 'h');
	add(parsed.minutes, 'minute', 'm');

	if (opts.compact) {
		add(parsed.seconds, 'second', 's');
		return '~' + ret[0];
	}

	var sec = ms / 1000 % 60;
	var secDecimalDigits = typeof opts.secDecimalDigits === 'number' ? opts.secDecimalDigits : 1;
	var secStr = sec.toFixed(secDecimalDigits).replace(/\.0$/, '');
	add(sec, 'second', 's', secStr);

	return ret.join(' ');
};

},{"is-finite":1,"parse-ms":3,"plur":4}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var prettyBytesOriginal = require('pretty-bytes');
var prettyMs = require('pretty-ms');

var pluginInterval;
var progress = 0;
var environment = {
  compressors: [],
  totalCompressors: 0,
  originalFileSize: 0,
  completionRatio: 0,
  filesToCompress: [],
  progressAnimation: 0,
  emojis: ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚']
};

var prettyBytes = function prettyBytes(size) {
  var r = prettyBytesOriginal(size).toUpperCase().replace(/\sB/g, ' bytes');
  return r;
};
var showMessage = function showMessage(txt, timeout) {
  var time = timeout || 5;
  NSApplication.sharedApplication().orderedDocuments().firstObject().displayMessage_timeout('Image Compressor: ' + txt, time);
};
var getArgumentsForCompressor = function getArgumentsForCompressor(compressorName, fileName, options) {
  var args;
  switch (compressorName) {
		case 'pngquant':
      /*
			### `--quality min-max`

			`min` and `max` are numbers in range 0 (worst) to 100 (perfect), similar to JPEG. pngquant will use the least amount of colors required to meet or exceed the `max` quality. If conversion results in quality below the `min` quality the image won't be saved (if outputting to stdin, 24-bit original will be output) and pngquant will exit with status code 99.

			    pngquant --quality=65-80 image.png

			### `--ext new.png`

			Set custom extension (suffix) for output filename. By default `-or8.png` or `-fs8.png` is used. If you use `--ext=.png --force` options pngquant will overwrite input files in place (use with caution).

			### `-o out.png` or `--output out.png`

			Writes converted file to the given path. When this option is used only single input file is allowed.

			### `--skip-if-larger`

			Don't write converted files if the conversion isn't worth it.

			### `--speed N`

			Speed/quality trade-off from 1 (brute-force) to 11 (fastest). The default is 3. Speed 10 has 5% lower quality, but is 8 times faster than the default. Speed 11 disables dithering and lowers compression level.

			### `--nofs`

			Disables Floyd-Steinberg dithering.

			### `--floyd=0.5`

			Controls level of dithering (0 = none, 1 = full). Note that the `=` character is required.

			### `--posterize bits`

			Reduce precision of the palette by number of bits. Use when the image will be displayed on low-depth screens (e.g. 16-bit displays or compressed textures in ARGB444 format).

			### `--strip`

			Don't copy optional PNG chunks. Metadata is always removed on Mac (when using Cocoa reader).
      */
      // Our defaults: advpng -z3 fileName
      if (options == 'fast') {
        args = NSArray.arrayWithObjects('--quality=80-90', '--strip', '--ext=-compressed.png', fileName, nil);
      } else {
        args = NSArray.arrayWithObjects('--strip', fileName, nil);
      }
      break;
    case 'advpng':
      /*
      advancecomp v1.21 by Andrea Mazzoleni, http://www.advancemame.it
      Usage: advpng [options] [FILES...]
       Modes:
        -l, --list            List the content of the files
        -z, --recompress      Recompress the specified files
      Options:
        -0, --shrink-store    Don't compress
        -1, --shrink-fast     Compress fast (zlib)
        -2, --shrink-normal   Compress normal (7z)
        -3, --shrink-extra    Compress extra (7z)
        -4, --shrink-insane   Compress extreme (zopfli)
        -i N, --iter=N        Compress iterations
        -f, --force           Force the new file also if it's bigger
        -q, --quiet           Don't print on the console
        -h, --help            Help of the program
        -V, --version         Version of the program
      */
      // Our defaults: advpng -z3 fileName
      if (options == 'fast') {
        args = NSArray.arrayWithObjects('-z2', fileName, nil);
      } else {
        args = NSArray.arrayWithObjects('-z3', fileName, nil);
      }
      break;
    case 'jpegoptim':
      /*
      jpegoptim v1.4.4beta  Copyright (c) 1996-2015, Timo Kokkonen
      Usage: jpegoptim [options] <filenames>
         -d<path>, --dest=<path>
                          specify alternative destination directory for
                          optimized files (default is to overwrite originals)
        -f, --force       force optimization
        -h, --help        display this help and exit
        -m<quality>, --max=<quality>
                          set maximum image quality factor (disables lossless
                          optimization mode, which is by default on)
                          Valid quality values: 0 - 100
        -n, --noaction    don't really optimize files, just print results
        -S<size>, --size=<size>
                          Try to optimize file to given size (disables lossless
                          optimization mode). Target size is specified either in
                          kilo bytes (1 - n) or as percentage (1% - 99%)
        -T<threshold>, --threshold=<threshold>
                          keep old file if the gain is below a threshold (%)
        -b, --csv         print progress info in CSV format
        -o, --overwrite   overwrite target file even if it exists (meaningful
                          only when used with -d, --dest option)
        -p, --preserve    preserve file timestamps
        -P, --preserve-perms
                          preserve original file permissions by overwriting it
        -q, --quiet       quiet mode
        -t, --totals      print totals after processing all files
        -v, --verbose     enable verbose mode (positively chatty)
        -V, --version     print program version
         -s, --strip-all   strip all markers from output file
        --strip-none      do not strip any markers
        --strip-com       strip Comment markers from output file
        --strip-exif      strip Exif markers from output file
        --strip-iptc      strip IPTC/Photoshop (APP13) markers from output file
        --strip-icc       strip ICC profile markers from output file
        --strip-xmp       strip XMP markers markers from output file
         --all-normal      force all output files to be non-progressive
        --all-progressive force all output files to be progressive
        --stdout          send output to standard output (instead of a file)
        --stdin           read input from standard input (instead of a file)
      */
      // Our options: jpegoptim --strip-all --all-normal fileName
      args = NSArray.arrayWithObjects('--strip-all', '--all-normal', fileName, nil);
      break;
    case 'jpegtran':
      /*
      usage: jpegtran [switches] [inputfile]
      Switches (names may be abbreviated):
        -copy none     Copy no extra markers from source file
        -copy comments Copy only comment markers (default)
        -copy all      Copy all extra markers
        -optimize      Optimize Huffman table (smaller file, but slow compression)
        -progressive   Create progressive JPEG file
      Switches for modifying the image:
        -crop WxH+X+Y  Crop to a rectangular subarea
        -flip [horizontal|vertical]  Mirror image (left-right or top-bottom)
        -grayscale     Reduce to grayscale (omit color data)
        -perfect       Fail if there is non-transformable edge blocks
        -rotate [90|180|270]         Rotate image (degrees clockwise)
        -scale M/N     Scale output image by fraction M/N, eg, 1/8
        -transpose     Transpose image
        -transverse    Transverse transpose image
        -trim          Drop non-transformable edge blocks
        -wipe WxH+X+Y  Wipe (gray out) a rectangular subarea
      Switches for advanced users:
        -arithmetic    Use arithmetic coding
        -restart N     Set restart interval in rows, or in blocks with B
        -maxmemory N   Maximum memory to use (in kbytes)
        -outfile name  Specify name for output file
        -verbose  or  -debug   Emit debug output
      Switches for wizards:
        -scans file    Create multi-scan JPEG per script file
      */
      // Our settings: jpegtran -copy none -optimize fileName
      args = NSArray.arrayWithObjects('-copy none', '-optimize', fileName, nil);
      break;
    case 'optipng':
      /*
      Synopsis:
          optipng [options] files ...
      Files:
          Image files of type: PNG, BMP, GIF, PNM or TIFF
      Basic options:
          -?, -h, -help	show the extended help
          -o <level>		optimization level (0-7)		[default: 2]
          -v			run in verbose mode / show copyright and version info
      Examples:
          optipng file.png						(default speed)
          optipng -o5 file.png					(slow)
          optipng -o7 file.png					(very slow)
      Type "optipng -h" for extended help.
      */
      // Our settings (fast): optipng -o1 fileName
      // Our settings (best): optipng -o5 fileName
      args = options == 'fast' ? NSArray.arrayWithObjects('-o7', fileName, nil) : NSArray.arrayWithObjects('-o5', fileName, nil);
      break;
    case 'pngcrush':
      /*
      usage: pngcrush [options except for -e -d] infile.png outfile.png
             pngcrush -e ext [other options] file.png ...
             pngcrush -d dir/ [other options] file.png ...
             pngcrush -ow [other options] file.png [tempfile.png]
             pngcrush -n -v file.png ...
      options:
               -bail (bail out of trial when size exceeds best size found
            -blacken (zero samples underlying fully-transparent pixels)
              -brute (use brute-force: try 148 different methods)
                  -c color_type of output file [0, 2, 4, or 6]
                  -d directory_name/ (where output files will go)
                  -e extension  (used for creating output filename)
                  -f user_filter [0-5] for specified method
                -fix (salvage PNG with otherwise fatal conditions)
              -force (write output even if IDAT is larger)
                  -g gamma (float or fixed*100000, e.g., 0.45455 or 45455)
            -huffman (use only zlib strategy 2, Huffman-only)
               -iccp length "Profile Name" iccp_file
               -itxt b[efore_IDAT]|a[fter_IDAT] "keyword"
               -keep chunk_name
                  -l zlib_compression_level [0-9] for specified method
               -loco ("loco crush" truecolor PNGs)
                  -m method [1 through 150]
                -max maximum_IDAT_size [default 524288L]
                -mng (write a new MNG, do not crush embedded PNGs)
                  -n (no save; doesn't do compression or write output PNG)
                -new (Use new default settings (-reduce))
       -newtimestamp (Reset file modification time [default])
             -nobail (do not bail out early from trial -- see "-bail")
        -nofilecheck (do not check for infile.png == outfile.png)
            -noforce (default; do not write output when IDAT is larger)
           -nolimits (turns off limits on width, height, cache, malloc)
           -noreduce (turns off all "-reduce" operations)
      -noreduce_palette (turns off "-reduce_palette" operation)
                -old (Use old default settings (no -reduce))
       -oldtimestamp (Do not reset file modification time)
                 -ow (Overwrite)
                  -q (quiet) suppresses console output except for warnings
             -reduce (do lossless color-type or bit-depth reduction)
                -rem chunkname (or "alla" or "allb")
      -replace_gamma gamma (float or fixed*100000) even if it is present.
                -res resolution in dpi
                -rle (use only zlib strategy 3, RLE-only)
                  -s (silent) suppresses console output including warnings
               -save (keep all copy-unsafe PNG chunks)
              -speed Avoid the AVG and PAETH filters, for decoding speed
               -srgb [0, 1, 2, or 3]
               -ster [0 or 1]
               -text b[efore_IDAT]|a[fter_IDAT] "keyword" "text"
         -trns_array n trns[0] trns[1] .. trns[n-1]
               -trns index red green blue gray
                  -v (display more detailed information)
            -version (display the pngcrush version)
                  -w compression_window_size [32, 16, 8, 4, 2, 1, 512]
                  -z zlib_strategy [0, 1, 2, or 3] for specified method
               -zmem zlib_compression_mem_level [1-9, default 9]
              -zitxt b|a "keyword" "lcode" "tkey" "text"
               -ztxt b[efore_IDAT]|a[fter_IDAT] "keyword" "text"
                  -h (help and legal notices)
                  -p (pause)
      */
      // Our settings (quick): pngcrush -ow -speed -noforce -blacken -bail -rem alla fileName
      // Our settings (small): pngcrush -ow -reduce -noforce -blacken -bail -rem alla fileName
      // ImageOptim also uses a '-cc' option, but it seems to be nonexistant on this version of pngcrush
      // They also have an optional '-brute' option, but we'll leave that out by now…
      // Also, there's this warning on their code: "// pngcrush sometimes writes only PNG header (70 bytes)!"
      // args = NSArray.arrayWithObjects('-ow', '-speed', '-noforce', '-blacken', '-bail', '-rem alla', fileName, nil)
      // args = NSArray.arrayWithObjects('-ow', '-new', '-noforce', '-blacken', '-bail', '-rem alla', fileName, nil)
      if (options == 'fast') {
        args = NSArray.arrayWithObjects('-ow', '-new', fileName, nil);
      } else {
        args = NSArray.arrayWithObjects('-ow', '-reduce', '-noforce', '-blacken', '-bail', '-rem alla', '-new', fileName, nil);
      }
      break;
    case 'zopflipng':
      /*
      ZopfliPNG, a Portable Network Graphics (PNG) image optimizer.
       Usage: zopflipng [options]... infile.png outfile.png
             zopflipng [options]... --prefix=[fileprefix] [files.png]...
       If the output file exists, it is considered a result from a previous run and not overwritten if its filesize is smaller.
       Options:
      -m: compress more: use more iterations (depending on file size)
      --prefix=[fileprefix]: Adds a prefix to output filenames. May also contain a directory path. When using a prefix, multiple input files can be given and the output filenames are generated with the prefix
       If --prefix is specified without value, 'zopfli_' is used.
       If input file names contain the prefix, they are not processed but considered as output from previous runs. This is handy when using *.png wildcard expansion with multiple runs.
      -y: do not ask about overwriting files.
      --lossy_transparent: remove colors behind alpha channel 0. No visual difference, removes hidden information.
      --lossy_8bit: convert 16-bit per channel image to 8-bit per channel.
      -d: dry run: don't save any files, just see the console output (e.g. for benchmarking)
      --always_zopflify: always output the image encoded by Zopfli, even if it's bigger than the original, for benchmarking the algorithm. Not good for real optimization.
      -q: use quick, but not very good, compression (e.g. for only trying the PNG filter and color types)
      --iterations=[number]: number of iterations, more iterations makes it slower but provides slightly better compression. Default: 15 for small files, 5 for large files.
      --splitting=[0-3]: ignored, left for backwards compatibility
      --filters=[types]: filter strategies to try:
       0-4: give all scanlines PNG filter type 0-4
       m: minimum sum
       e: entropy
       p: predefined (keep from input, this likely overlaps another strategy)
       b: brute force (experimental)
       By default, if this argument is not given, one that is most likely the best for this image is chosen by trying faster compression with each type.
       If this argument is used, all given filter types are tried with slow compression and the best result retained. A good set of filters to try is --filters=0me.
      --keepchunks=nAME,nAME,...: keep metadata chunks with these names that would normally be removed, e.g. tEXt,zTXt,iTXt,gAMA, ...
       Due to adding extra data, this increases the result size. Keeping bKGD or sBIT chunks may cause additional worse compression due to forcing a certain color type, it is advised to not keep these for web images because web browsers do not use these chunks. By default ZopfliPNG only keeps (and losslessly modifies) the following chunks because they are essential: IHDR, PLTE, tRNS, IDAT and IEND.
       Usage examples:
      Optimize a file and overwrite if smaller: zopflipng infile.png outfile.png
      Compress more: zopflipng -m infile.png outfile.png
      Optimize multiple files: zopflipng --prefix a.png b.png c.png
      Compress really good and trying all filter strategies: zopflipng --iterations=500 --filters=01234mepb --lossy_8bit --lossy_transparent infile.png outfile.png
      */
      // Our options (quick): zopflipng -q -y
      // Our options (small): zopflipng -m -y --lossy_transparent
      if (options == 'fast') {
        args = NSArray.arrayWithObjects('-q', '-y', fileName, fileName, nil);
      } else {
        args = NSArray.arrayWithObjects('-m', '-y', fileName, fileName, nil);
      }
      break;
    default:

  }
  return args;
};
var runCompressor = function runCompressor(context, compressorName, fileName, options) {
  // log('Running compressor: ' + compressorName + ' for image ' + fileName)
  var compressorPath = context.plugin.urlForResourceNamed(compressorName).path();
  var compressTask = NSTask.alloc().init();
  compressTask.setLaunchPath(compressorPath);
  var args = getArgumentsForCompressor(compressorName, fileName, options);
  compressTask.setArguments(args);
  compressTask.launch();
  environment.compressors.push(compressTask);
  environment.totalCompressors += 1;
  // compressTask.waitUntilExit() // This blocks the UI, which sucks for non-trivial jobs
  log(compressorName + ': ' + fileName + ' — ' + prettyBytes(fileSizeForPath(fileName)));
};
var runFullCompressor = function runFullCompressor(context, fileObject) {
  if (fileObject.type == 'png' || fileObject.type == 'jpg') {
    var compressorPath;
    if (fileObject.type == 'png') {
      compressorPath = context.plugin.urlForResourceNamed('compress-full-png.sh').path();
    } else {
      compressorPath = context.plugin.urlForResourceNamed('compress-full-jpg.sh').path();
    }
    var compressTask = NSTask.alloc().init();
    compressTask.setLaunchPath(compressorPath);
    compressTask.setArguments(NSArray.arrayWithObjects(fileObject.path, nil));
    compressTask.launch();
    // compressTask.waitUntilExit()
    environment.compressors.push(compressTask);
    environment.totalCompressors += 1;
    log('Full Compression: ' + fileObject.path + ' — ' + prettyBytes(fileSizeForPath(fileObject.path)));
  }
};
var fileSizeForPath = function fileSizeForPath(path) {
  var fileSize = 0;
  if (path) {
    fileSize = NSFileManager.defaultManager().attributesOfItemAtPath_error(path, nil).fileSize();
  }
  return fileSize;
};
var ratioForNumbers = function ratioForNumbers(one, two) {
  return (100 - two * 100 / one).toFixed(2) + '%';
};
var onInterval = function onInterval(context) {
  var runningTime = prettyMs(progress * 100);
  var ratioPerCompressor = 100 / environment.totalCompressors;

  for (var i = 0; i < environment.compressors.length; i++) {
    var task = environment.compressors[i];
    // log(task.terminationStatus())
    if (!task.isRunning()) {
      // In theory this was deprecated in 10.9?
      environment.compressors.splice(i, 1); // Remove compressor from array when we're done with it
      environment.completionRatio += ratioPerCompressor;
    }
  }
  // If all compressors are done running, disable shouldKeepAround:
  if (environment.compressors.length == 0) {
    var originalFileSize = prettyBytes(environment.originalFileSize);
    var compressFileSize = 0;
    for (var i = 0; i < environment.filesToCompress.length; i++) {
      var f = environment.filesToCompress[i];
      compressFileSize += fileSizeForPath(f.path);
    }
    var ratio = ratioForNumbers(environment.originalFileSize, compressFileSize);
    compressFileSize = prettyBytes(compressFileSize);
    var msg = 'finished in ' + runningTime + '. ' + originalFileSize + ' → ' + compressFileSize + ' (' + ratio + ' off)';
    showMessage(msg, 10);
    log(msg);
    disableBackgroundPlugin();
  } else {
    var emojiAnimation = environment.emojis[++environment.progressAnimation % 12];
    showMessage(emojiAnimation + ' ' + environment.compressors.length + ' compressor' + (environment.compressors.length > 1 ? 's' : '') + ' running. ' + environment.completionRatio.toFixed(2) + '% done.');
    progress++;
  }
};
var getFilesToCompress = function getFilesToCompress(exportedAssets) {
  var filesToCompress = [];
  for (var i = 0; i < exportedAssets.count(); i++) {
    var currentExport = exportedAssets.objectAtIndex(i);
    // TODO: sometimes, when you try to export *huge* files from Sketch, it will simply refuse
    // to export them. But it will still report those assets as exported in context.actionContext.exports.
    // I've filed the issue in <https://github.com/BohemianCoding/Sketch/issues/9597> and will hopefully
    // be fixed soon, but meanwhile we'll work around it (which is a good idea anyway)
    // TODO: Maybe we should show a warning message explaining why those huge assets weren't exported?
    if (NSFileManager.defaultManager().fileExistsAtPath(currentExport.path)) {
      var fileSize = fileSizeForPath(currentExport.path);
      // TODO: Maybe we could simply have a generic compression Plugin that also does SVG and PDF?
      if (currentExport.request.format() == 'png' || currentExport.request.format() == 'jpg') {
        filesToCompress.push({ path: currentExport.path, size: fileSize, type: currentExport.request.format() });
        environment.originalFileSize += fileSize;
      }
    }
  }
  return filesToCompress;
};
var openFileDialog = function openFileDialog(path) {
  var openDlg = NSOpenPanel.openPanel();
  // var openDlg = NSSavePanel.savePanel()
  openDlg.setTitle('Export & Compress All Assets In…');
  openDlg.setCanChooseFiles(false);
  openDlg.setCanChooseDirectories(true);
  openDlg.allowsMultipleSelection = false;
  openDlg.setCanCreateDirectories(true);
  openDlg.setPrompt('Save');
  if (path) {
    openDlg.setDirectoryURL(path);
  }
  var buttonClicked = openDlg.runModal();
  var ret = null;
  if (buttonClicked == NSOKButton) {
    ret = openDlg.URLs().firstObject().path();
  }
  return ret;
};
var enableBackgroundPlugin = function enableBackgroundPlugin() {
  coscript.setShouldKeepAround(true);
  pluginInterval = coscript.scheduleWithRepeatingInterval_jsFunction(0.1, onInterval);
};
var disableBackgroundPlugin = function disableBackgroundPlugin() {
  coscript.setShouldKeepAround(false);
  pluginInterval.cancel();
};
var exportAndCompress = function exportAndCompress(context) {
  var potentialExports = context.document.allExportableLayers();
  if (potentialExports.count() > 0) {
    showMessage('Exporting compressed assets. This is going to take a bit…');
    enableBackgroundPlugin();
    var exportFolder = openFileDialog();
    if (exportFolder) {
      // TODO: If there's any exportable layer selected, only export those. Otherwise, export everything under the sun
      var exports = NSMutableArray.alloc().init();
      for (var exportCount = 0; exportCount < potentialExports.count(); exportCount++) {
        var exportableLayer = potentialExports.objectAtIndex(exportCount);
        var requests = MSExportRequest.exportRequestsFromExportableLayer(exportableLayer);
        if (requests.count() > 0) {
          for (var j = 0; j < requests.count(); j++) {
            var request = requests.objectAtIndex(j);
            var path = NSString.pathWithComponents([exportFolder, request.name() + '.' + request.format()]);
            exports.addObject({ request: request, path: path });
          }
        }
      }

      // First we'll need to actually export the assets
      for (var k = 0; k < exports.count(); k++) {
        var currentExport = exports.objectAtIndex(k);
        var render;
        if (currentExport.request.format() == "svg") {
          render = MSExportRendererWithSVGSupport.exporterForRequest_colorSpace(currentExport.request, NSColorSpace.sRGBColorSpace());
        } else {
          render = MSExporter.exporterForRequest_colorSpace(currentExport.request, NSColorSpace.sRGBColorSpace());
        }
        render.data().writeToFile_atomically(currentExport.path, true);
      }
      // …and then we'll be able to compress them :)
      environment.filesToCompress = getFilesToCompress(exports);
      if (environment.filesToCompress.length > 0) {
        for (var p = 0; p < environment.filesToCompress.length; p++) {
          var currentFile = environment.filesToCompress[p];
          runFullCompressor(context, currentFile);
        }
      } else {
        // showMessage('nothing to compress')
        coscript.setShouldKeepAround(false);
      }
    }
  } else {
    showMessage('There are no exportable layers in the document.');
  }
};
var compressAutomatically = function compressAutomatically(context) {

  environment.filesToCompress = getFilesToCompress(context.actionContext.exports);

  if (environment.filesToCompress.length > 0) {
    enableBackgroundPlugin();
    for (var p = 0; p < environment.filesToCompress.length; p++) {
      var currentFile = environment.filesToCompress[p];
      // PNG Compressors.
      if (currentFile.type == 'png') {
        runCompressor(context, 'pngquant', currentFile.path, 'fast');
      }
      if (currentFile.type == 'jpg') {
        runCompressor(context, 'jpegoptim', currentFile.path);
      }
    }
  } else {
    // showMessage('nothing to compress')
  }
};

var SketchPlugin = exports.SketchPlugin = {
  name: "Sketch Image Compressor",
  description: "A Plugin that compresses bitmap assets, right when you export them. This Plugin *requires* Sketch 3.8.",
  author: "Ale Muñoz",
  authorEmail: "ale@sketchapp.com",
  version: "1.2.6",
  identifier: "com.sketchapp.plugins.image-compressor",
  homepage: "https:/github.com/BohemianCoding/image-compressor",
  compatibleVersion: 3.8,
  commands: {
    imageCompress: {
      name: 'Export All Assets',
      handlers: {
        run: "___imageCompress_run_handler_",
        actions: {
          "ExportSlices": "___imageCompress_run_handler_",
          "Export": "___imageCompress_run_handler_"
        }
      },
      run: function run(context) {
        if (context.actionContext) {
          // Plugin was triggered automatically
          compressAutomatically(context);
        } else {
          // Plugin was triggered from the menu, so crush with all the power we've got : )
          exportAndCompress(context);
        }
      }
    }
  }
};

__globals.___imageCompress_run_handler_ = function (context, params) {
  SketchPlugin.commands['imageCompress'].run(context, params);
};

__globals.___imageCompress_setUp_handler_ = function (context, params) {
  SketchPlugin.commands['imageCompress'].setUp(context, params);
};

__globals.___imageCompress_tearDown_handler_ = function (context, params) {
  SketchPlugin.commands['imageCompress'].tearDown(context, params);
};

/*__$begin_of_manifest_
{
    "name": "Sketch Image Compressor",
    "description": "A Plugin that compresses bitmap assets, right when you export them. This Plugin *requires* Sketch 3.8.",
    "author": "Ale Muñoz",
    "authorEmail": "ale@sketchapp.com",
    "version": "1.2.6",
    "identifier": "com.sketchapp.plugins.image-compressor",
    "homepage": "https:/github.com/BohemianCoding/image-compressor",
    "compatibleVersion": 3.8,
    "commands": [
        {
            "identifier": "imageCompress",
            "handler": "___imageCompress_run_handler_",
            "script": "plugin.js",
            "name": "Export All Assets",
            "handlers": {
                "run": "___imageCompress_run_handler_",
                "actions": {
                    "ExportSlices": "___imageCompress_run_handler_",
                    "Export": "___imageCompress_run_handler_"
                }
            }
        }
    ],
    "disableCocoaScriptPreprocessor": true
}__$end_of_manifest_
*/

},{"pretty-bytes":5,"pretty-ms":6}]},{},[7]);
