<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Counter from './Counter.svelte';

  const { Story } = defineMeta({
    title: 'Example/Counter',
    component: Counter,
    tags: ['autodocs'],
  });
</script>

<Story name="Default" args={{ initial: 0 }} />
<Story name="StartsAtTen" args={{ initial: 10 }} />
