#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>

int main(void) {
    unsigned char key[32];
    int fd = open("/dev/urandom", O_RDONLY);
    if (fd < 0) {
        perror("failed open  at /dev/urandom");
        return 1;
    }

    ssize_t bytesread = read(fd, key, sizeof(key));
    if (bytesread < 0) {
        perror("failedRead from /dev/urandom");
        close(fd);
        return 1;
    } else if (bytesread != 32) {
        fprintf(stderr, "no 32byte chunk available\n");
        close(fd);
        return 1;
    }

    close(fd);

    printf("gen hex ===== ");
    for (int i = 0; i < 32; i++) {
        printf("%02x", key[i]);
    }
    printf("\n");

    return 0;
}