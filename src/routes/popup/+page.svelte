<script>
    import { Button, Card } from 'flowbite-svelte';
</script>

<svelte:head>
    <link rel="stylesheet" href="popup.css">
</svelte:head>

<Card class="flex flex-col items-center justify-center w-full h-full gap-4" shadow={false}>
    <h1 class="mb-2 text-4xl font-bold text-center">Autonomous Attention Aid</h1>
    <Button
        color="blue"
    on:click={() => window.open(chrome.runtime.getURL('index.html'), '_blank')}
    >Get Started</Button>
</Card>

<style>

</style>