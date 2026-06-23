export function getLp3Html(targetUrl) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="shortcut icon" href="/lp3/mydates.png">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>MyDates | Find your flirt or chat partner!</title>
<link rel="stylesheet" href="/lp3/bootstrap.min.css">
<link href="/lp3/app-style.css" rel="stylesheet">
</head>
<body>
<header>
  <div class="overlay"></div>
  <video playsinline="playsinline" autoplay="autoplay" muted="muted" loop="loop">
    <source src="/lp3/girl-dancing.mp4" type="video/mp4">
  </video>
  <div class="container h-100">
    <div class="d-flex h-100 text-center align-items-center">
      <div class="w-100 text-white">
        <h1><span id="njeblit"> WARNING ! </span></h1>
        <p class="lead mb-0">You will see nude photos and videos. <br> Please be discreet. <br><strong> Click continue if you are 18 years old or older </strong></p>
        <p>
            <a href="TARGET_URL_PLACEHOLDER" class="btn btn-danger btn-lg mt-5 win">CONTINUE</a>
        </p>
        <hr style="margin: 3px;padding: 3px;border-radius: 3px;border: 3px;">
        <p><img src="/lp3/secure-png-4.png" style="width: 50px;"> This program is verified and secure.</p>
      </div>
    </div>
  </div>
</header>
</body>
</html>`;
    return html.replace('TARGET_URL_PLACEHOLDER', targetUrl);
}
