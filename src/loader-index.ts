import GltfLoader from './engine/util/GltfLoader'

async function run() {
  const loader = new GltfLoader('/tree.glb')
  await loader.ready

  console.log(loader)
  window.loader = loader

  const copy = {
    ...loader,
  }
  delete copy.bufferData

  document.body.innerHTML = `<pre>${JSON.stringify(copy, null, 4)}</pre>`
}

run()
