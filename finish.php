<?php
session_start();
  if (!isset($_SESSION["user_id"])){
     header("Location:https:login.php");
     exit;
}
?>

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" type="text/css" href="css/lib.css">
  <link rel="stylesheet" type="text/css" href="css/index.css">
  <style type="text/css">
   input {
      margin: 80px auto;
   }
  </style>
  <title>母語話者シャドーイング</title>
</head>
<body>
  <form>
    <h1>母語話者シャドーイング</h1>
    <h2>This is the last page.<br>Thanks for joining.</h2>
    <input type="button" onclick="location.href='https://goo.gl/forms/OQBTgCfLPu5vdVQw2'" value="Questionnaire" />
  </form>
<footer id="footer">Copyright &copy; <span class="nowyear"></span> Minematsu & Saito Laboratory, The University of Tokyo.</footer>
<script type="text/javascript" src="js/footerFixed.js"></script>
</body>
</html>
