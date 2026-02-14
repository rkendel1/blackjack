<svelte:options customElement="sl-bluetooth-simple" />

<script lang="ts">
  export let testProp: string = 'default';
</script>

<div class="simple-test">
  <h2>Simple Bluetooth Test</h2>
  <p>Test prop: {testProp}</p>
</div>

<style>
  .simple-test {
    padding: 1rem;
    background: lightblue;
    border: 2px solid blue;
  }
</style>
