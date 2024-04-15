<script lang="ts">
  export let navigation:Map<string,string>;
  let toggleFlag = false;
  
  const toggle=()=>{
    toggleFlag =!toggleFlag;
  }
</script>

<header class="flex flex-col sticky w-full top-0 z-50 bg-white border-b max-md:flex-row max-md:justify-between max-md:px-4 max-md:items-center">
  <div class="relative flex w-full justify-between items-center">
    <nav class="flex flex-col md:flex-row lg:flex-row justify-center items-center w-full px-4 gap-4 py-2">
        <a href="/" class="text-red-600 max-md:self-start">
          <slot name="tfp-logo"/>
        </a>
      <div  class={`transition transform flex-grow  ${toggleFlag ? "max-md:block":"max-md:hidden"}`}>
        <ul class="flex gap-4 max-md:flex-col">
          {#each navigation as [label, href] }
            <a href={href} class="text-zinc-950">
              {label}
            </a>
          {/each}
        </ul>
      </div>
      <div class={toggleFlag ? "max-md:block":"max-md:hidden"}>
        <slot name="socials"/>
      </div>
    </nav>
    <button class=" hover:cursor-pointer md:hidden max-md:self-start max-md:pt-2" on:click={toggle}>
      {#if toggleFlag}
      <slot name="close"/>
      {:else}
      <slot name="burger-icon"/>
      {/if}
    </button>
  </div>
</header>