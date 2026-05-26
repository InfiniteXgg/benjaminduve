import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Error inesperado en la aplicacion.',
    }
  }

  componentDidCatch(error) {
    console.error('AppErrorBoundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container">
          <section className="panel">
            <h2>Ocurrio un problema al cargar la pagina</h2>
            <p className="muted">{this.state.message}</p>
            <p className="muted">Recarga la pagina. Si persiste, reinicia el contenedor frontend.</p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
