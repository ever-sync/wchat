import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  error: Error | null;
};

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="font-syne text-xl font-semibold text-foreground">
              {this.props.title ?? "Algo deu errado nesta tela"}
            </h2>
            <p className="text-sm text-muted-foreground break-words">{this.state.error.message}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => this.setState({ error: null })}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
