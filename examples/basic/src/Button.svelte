<script lang="ts">
  type Props = {
    label?: string;
    variant?: 'primary' | 'secondary';
    onclick?: (e: MouseEvent) => void;
  };

  let { label = 'Click me', variant = 'primary', onclick }: Props = $props();
</script>

<button class={variant} {onclick}>{label}</button>

<style>
  button {
    border-radius: 6px;
    padding: 8px 14px;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .primary {
    background: #ff3e00;
    color: white;
  }
  .secondary {
    background: white;
    color: #ff3e00;
    border-color: #ff3e00;
  }
</style>
