<template>
  <section class="container">
    <div>
      <!-- <app-logo/> -->
      <h1 class="title">
        <span>デ</span> ン プ ス <span>タ</span> ー
      </h1>
      <h2 class="subtitle">
       <a href="https://github.com/JWTappert">d e r p s t a r r</a>
      </h2>
      <div class="links">
       derp
      </div>
    </div>
  </section>
</template>

<script>
import AppLogo from '~/components/AppLogo.vue'

export default {
  components: {
    AppLogo
  }
}
</script>

<style>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* 1 */
  display: block;
  font-size: 100px;
  letter-spacing: 5px;
	-webkit-text-stroke: 1px white;
  color: white;
  text-shadow: 0 -40px 100px, 0 0 2px, 0 0 1em #FF1D8E, 0 0 0.5em #FF1D8E, 0 0 0.1em #FF1D8E, 0 10px 3px #000;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: white;
  word-spacing: 50px;
  padding-bottom: 15px;
  text-shadow: 0 -40px 100px, 0 0 2px, 0 0 1em #FF1D8E, 0 0 0.5em #FF1D8E, 0 0 0.1em #FF1D8E, 0 10px 3px #000;
}

.subtitle a {
  color: inherit;
  text-decoration: inherit;
}

.links {
  padding-top: 15px;
}

body {
  background-color: black;
}

.title span {
  animation: blink linear 2s infinite;
}

@keyframes blink {
  78% {
    color: inherit;
    text-shadow: inherit;
  }
  79%{
     color: #333;
  }
  80% {

    text-shadow: none;
  }
  81% {
    color: inherit;
    text-shadow: inherit;
  }
  82% {
    color: #333;
    text-shadow: none;
  }
  83% {
    color: inherit;
    text-shadow: inherit;
  }
  92% {
    color: #333;
    text-shadow: none;
  }
  92.5% {
    color: inherit;
    text-shadow: inherit;
  }
}

</style>
