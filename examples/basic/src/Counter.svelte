<script lang="ts">
  type Props = { initial?: number };
  let { initial = 0 }: Props = $props();
  let count = $state(initial);
</script>

<button onclick={() => count++}>Count: {count}</button>
