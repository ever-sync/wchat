export default function Preloader() {
    return (
        <>
            <div className="loader-wrap">
            <div className="preloader">
                <div className="preloader-close">x</div>
                <div id="handle-preloader" className="handle-preloader">
                    <div className="animation-preloader">
                        <div className="spinner"></div>
                        <div className="txt-loading">
                            <span data-text-preloader="a" className="letters-loading">
                                a
                            </span>
                            <span data-text-preloader="i" className="letters-loading">
                                i
                            </span>
                            <span data-text-preloader="z" className="letters-loading">
                                z
                            </span>
                            <span data-text-preloader="e" className="letters-loading">
                                e
                            </span>
                            <span data-text-preloader="n" className="letters-loading">
                                n
                            </span>
                            <span data-text-preloader="i" className="letters-loading">
                                i
                            </span>
                            <span data-text-preloader="u" className="letters-loading">
                                u
                            </span>
                            <span data-text-preloader="s" className="letters-loading">
                                s
                            </span>
                        </div>
                    </div>  
                </div>
            </div>
        </div>


        </>
    )
}
