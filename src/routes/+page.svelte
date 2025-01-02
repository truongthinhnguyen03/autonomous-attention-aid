<script lang="ts">
    import { timeLeft, startTimer } from '$lib/stores/timer';
    import { Button, Card } from 'flowbite-svelte';
    import { onMount } from 'svelte';
    import RealTimeTimeSeriesChart from '$lib/components/RealTimeTimeSeriesChart.svelte';
    import HorizontalGaugeChart from '$lib/components/HorizontalGaugeChart.svelte';
    let cleanup: () => void;
    let isConnected = false;
    let isPaused = false;
    let pipWindow: Window | null = null;

    function handleStart() {
        cleanup = startTimer();
    }

    function handleConnect() {
        isConnected = !isConnected;
    }

    // Add keyboard shortcut
    onMount(() => {
        const handleKeypress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                handleStart();
            }
        };
        
        document.addEventListener('keydown', handleKeypress);
        return () => {
            document.removeEventListener('keydown', handleKeypress);
        };
    });

    // Type declaration for Window
    declare global {
        interface Window {
            documentPictureInPicture: {
                requestWindow(options: {
                    width: number;
                    height: number;
                    preferInitialWindowPlacement: boolean;
                    disallowReturnToOpener: boolean;
                }): Promise<Window>;
            };
        }
    }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
    <Card class="max-w-2xl mx-auto" shadow={false} border={true}>
        <div class="space-y-8">
            <!-- Header -->
            <div class="text-center">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Autonomous Attention Aid
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                    Monitor your focus in real-time
                </p>
            </div>

            <!-- Controls -->
            <div class="flex justify-center gap-4">
                <Button 
                    color="blue" 
                    class="px-6"
                    on:click={handleConnect}
                >
                    {isConnected ? 'Disconnect' : 'Connect'}
                </Button>
                <Button
                    color="green"
                    class="px-6"
                    on:click={async () => {
                        if (!pipWindow) {
                            // Start Session
                            if (window.documentPictureInPicture) {
                                try {
                                    const chartElement = document.getElementById('chart');
                                    if (!chartElement) return;

                                    pipWindow = await window.documentPictureInPicture.requestWindow({
                                        width: 400,
                                        height: 100,
                                        preferInitialWindowPlacement: true,
                                        disallowReturnToOpener: true
                                    });
                                    
                                    [...document.styleSheets].forEach((styleSheet) => {
                                        try {
                                            const cssRules = [...styleSheet.cssRules]
                                                .map((rule) => rule.cssText)
                                                .join('');
                                            const style = document.createElement('style');

                                            style.textContent = cssRules;
                                            pipWindow.document.head.appendChild(style);
                                        } catch (e) {
                                            const link = document.createElement('link');

                                            link.rel = 'stylesheet';
                                            link.type = styleSheet.type;
                                            link.media = styleSheet.media.toString();
                                            link.href = styleSheet.href || '';
                                            pipWindow.document.head.appendChild(link);
                                        }
                                    });

                                    pipWindow.document.body.append(chartElement);

                                    pipWindow.addEventListener("pagehide", (event: Event) => {
                                        const chartContainer = document.getElementById("chartContainer");
                                        if (!chartContainer) return;
                                        
                                        const target = event.target as Document;
                                        const pipChart = target.getElementById("chart");
                                        if (pipChart) {
                                            chartContainer.append(pipChart);
                                        }
                                        pipWindow = null;  // Reset pipWindow when closed
                                    });
                                } catch (error) {
                                    console.error('Failed to open Picture-in-Picture window:', error);
                                    pipWindow = null;
                                }
                            }
                        } else {
                            // End Session
                            pipWindow.close();
                            pipWindow = null;
                        }
                    }}
                >
                    {pipWindow ? 'End Session' : 'Start Session'}
                </Button>
            </div>

            <!-- Chart Container -->
            <div  class="w-full flex flex-row justify-center items-center border-2 border-gray-200 rounded-lg p-4">
                <div  class="flex justify-center w-full">
                    <RealTimeTimeSeriesChart 
                        width={500}
                        height={200}
                        maxPoints={100}
                        {isConnected}
                    />  
                </div>
            </div>    
            
            <div id="chartContainer" class="w-full flex flex-col justify-center items-center border-2 border-gray-200 rounded-lg p-4">
                <div id="chart" class="flex justify-center items-center w-full p-4 gap-4">  
                    <Button on:click={async () => {
                        try {
                            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                            if (!tab?.id) {
                                console.error('No active tab found');
                                return;
                            }

                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                func: (shouldPause) => {
                                    // Function to handle videos in both main page and iframes
                                    const controlVideos = (doc) => {
                                        // Get videos in current document
                                        const videos = doc.getElementsByTagName('video');
                                        for (const video of videos) {
                                            if (shouldPause) {
                                                video.pause();
                                            } else {
                                                video.play();
                                            }
                                        }

                                        // Get all iframes
                                        const iframes = doc.getElementsByTagName('iframe');
                                        for (const iframe of iframes) {
                                            try {
                                                // Try to access iframe content
                                                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                                                if (iframeDoc) {
                                                    controlVideos(iframeDoc);
                                                }
                                            } catch (e) {
                                                console.log('Cannot access iframe:', e);
                                            }
                                        }
                                    };

                                    // Start with the main document
                                    controlVideos(document);
                                },
                                args: [!isPaused]
                            });
                            
                            isPaused = !isPaused;
                        } catch (error) {
                            console.error('Failed to control video:', error);
                        }
                    }}>
                        {isPaused ? 'Play' : 'Pause'}
                    </Button>
                    <div class="h-24 w-[3px] bg-gray-200"></div>
                    <HorizontalGaugeChart 
                        simulateData={isConnected}
                        width={500}
                        height={100}
                    />
                </div>
            </div>
        </div>
    </Card>
</div>


